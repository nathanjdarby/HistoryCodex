import { DEFAULT_BATTLE_RULES } from "@/lib/battle/constants";
import { appendLog, drawCards, shuffle } from "@/lib/battle/rng";
import { createEmptyLane } from "@/lib/battle/locations";
import { scholarCountForPlayer } from "@/lib/battle/abilities";
import type { BattleRules, CardSnapshot, MatchState, PlayerId } from "@/lib/battle/types";
import { cpForTurn } from "@/lib/battle/constants";
import { defaultPlayerState, playerState, setPlayerState } from "@/lib/battle/types";

export type SetupInput = {
  playerDeck: CardSnapshot[];
  aiDeck: CardSnapshot[];
  startingPlayer?: PlayerId;
  rngSeed?: number;
  rules?: BattleRules;
};

export function handHasLocation(hand: CardSnapshot[]): boolean {
  return hand.some((card) => card.cardType === "location");
}

function initLanes(state: MatchState, rules: BattleRules): MatchState {
  const lanes = Array.from({ length: rules.activeLaneCount }, () => createEmptyLane());
  return appendLog(
    { ...state, lanes, locationDeck: [], pendingLocation: null },
    "setup",
    "Battlefield begins with no location — play one from your hand during Logistics.",
  );
}

function dealOpeningHand(
  state: MatchState,
  player: PlayerId,
  rules: BattleRules,
): MatchState {
  let next = state;
  for (let i = 0; i < rules.openingHandSize; i++) {
    next = drawCards(next, player, 1);
  }
  return next;
}

function reshuffleAndDealOpeningHand(
  state: MatchState,
  player: PlayerId,
  rules: BattleRules,
): MatchState {
  const ps = playerState(state, player);
  const shuffled = shuffle([...ps.deck, ...ps.hand], state);
  let next = setPlayerState(
    { ...state, ...shuffled.state },
    player,
    { ...ps, deck: shuffled.items, hand: [] },
  );
  return dealOpeningHand(next, player, rules);
}

export function ensureOpeningHandWithLocation(
  state: MatchState,
  player: PlayerId,
  rules: BattleRules = DEFAULT_BATTLE_RULES,
): MatchState {
  let next = state;
  let safety = 0;
  while (!handHasLocation(playerState(next, player).hand) && safety < 100) {
    next = reshuffleAndDealOpeningHand(next, player, rules);
    safety++;
  }
  return next;
}

export function beginFirstTurn(
  state: MatchState,
  rules: BattleRules = DEFAULT_BATTLE_RULES,
): MatchState {
  let next = appendLog(state, "setup", "Match started. Chronos Phase begins.");
  next = beginChronosPhase(next, rules);
  next = { ...next, phase: "logistics" };
  next = appendLog(next, "phase", `${next.activePlayer} begins Logistics.`);
  return next;
}

export function redrawOpeningHand(
  state: MatchState,
  player: PlayerId,
  rules: BattleRules = DEFAULT_BATTLE_RULES,
): MatchState | null {
  if (state.phase !== "opening" || player !== "player") return null;
  if (handHasLocation(playerState(state, player).hand)) return null;

  let next = reshuffleAndDealOpeningHand(state, player, rules);
  next = appendLog(next, "opening", "Opening hand redrawn.");

  if (handHasLocation(playerState(next, player).hand)) {
    next = beginFirstTurn(next, rules);
  }

  return next;
}

export function createMatchState(input: SetupInput): MatchState {
  const rules = input.rules ?? DEFAULT_BATTLE_RULES;
  const rngSeed = input.rngSeed ?? Date.now();
  let state: MatchState = {
    rngSeed,
    rngCounter: 1,
    phase: "chronos",
    activePlayer: input.startingPlayer ?? "player",
    turnNumber: 1,
    player: defaultPlayerState([]),
    ai: defaultPlayerState([]),
    lanes: [],
    locationDeck: [],
    pendingLocation: null,
    pendingChoice: null,
    log: [],
    pendingEvents: [],
    winner: null,
    status: "active",
  };

  const shuffledPlayer = shuffle(input.playerDeck, state);
  state = { ...state, ...shuffledPlayer.state, player: defaultPlayerState(shuffledPlayer.items) };

  const shuffledAi = shuffle(input.aiDeck, state);
  state = { ...state, ...shuffledAi.state, ai: defaultPlayerState(shuffledAi.items) };

  state = initLanes(state, rules);

  state = dealOpeningHand(state, "player", rules);
  state = dealOpeningHand(state, "ai", rules);
  state = ensureOpeningHandWithLocation(state, "ai", rules);

  if (handHasLocation(state.player.hand)) {
    return beginFirstTurn(state, rules);
  }

  return appendLog(
    { ...state, phase: "opening" },
    "opening",
    "No location in your opening hand — redraw until you draw one.",
  );
}

export function beginChronosPhase(state: MatchState, rules: BattleRules = DEFAULT_BATTLE_RULES): MatchState {
  const player = state.activePlayer;
  let next: MatchState = { ...state, phase: "chronos" };

  const cp = cpForTurn(next.turnNumber, rules);
  if (player === "player") {
    next = {
      ...next,
      player: {
        ...next.player,
        cp,
        cpGrantedThisTurn: cp,
        eventsPlayedThisTurn: 0,
      },
    };
  } else {
    next = {
      ...next,
      ai: {
        ...next.ai,
        cp,
        cpGrantedThisTurn: cp,
        eventsPlayedThisTurn: 0,
      },
    };
  }

  next = drawCards(next, player, 1);
  const scholars = scholarCountForPlayer(next, player);
  if (scholars > 0) {
    next = drawCards(next, player, scholars);
    next = appendLog(
      next,
      "scholar_draw",
      `${player} draws ${scholars} extra card(s) from Scholar(s).`,
    );
  }

  next = appendLog(next, "chronos", `${player} receives ${cp} CP and draws.`);
  return next;
}
