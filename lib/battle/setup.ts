import { DEFAULT_BATTLE_RULES, applyCpGain, cpForTurn } from "@/lib/battle/constants";
import { appendLog, drawCardsWithExhaustion, shuffle } from "@/lib/battle/rng";
import { createEmptyLane } from "@/lib/battle/types";
import { scholarCountForPlayer } from "@/lib/battle/abilities";
import { seatLocationFromDeck } from "@/lib/battle/locations";
import { splitExpandedDeck } from "@/lib/battle/validators";
import type { BattleRules, CardSnapshot, MatchState, PlayerId } from "@/lib/battle/types";
import { defaultPlayerState, playerState, setPlayerState } from "@/lib/battle/types";

export type SetupInput = {
  playerDeck: CardSnapshot[];
  aiDeck: CardSnapshot[];
  startingPlayer?: PlayerId;
  rngSeed?: number;
  rules?: BattleRules;
};

export function deckContainsLocation(deck: CardSnapshot[]): boolean {
  return deck.some((c) => c.cardType === "location");
}

function initLanes(state: MatchState, rules: BattleRules): MatchState {
  const lanes = Array.from({ length: rules.activeLaneCount }, () => createEmptyLane());
  return { ...state, lanes };
}

/**
 * Locations no longer live in either player's draw deck — deal a plain
 * opening hand from whatever's left after Location cards were split out at
 * setup (see createMatchState). No forcing/injection needed here anymore;
 * every active lane already got seated from the shared location deck before
 * hands are dealt.
 */
export function dealOpeningHand(
  state: MatchState,
  player: PlayerId,
  rules: BattleRules,
): MatchState {
  const ps = playerState(state, player);
  const deck = [...ps.deck];
  const hand: CardSnapshot[] = [];

  for (let i = 0; i < rules.openingHandSize && deck.length > 0; i++) {
    hand.push(deck.shift()!);
  }

  return setPlayerState(state, player, { ...ps, deck, hand });
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

export function createMatchState(input: SetupInput): MatchState {
  const rules = input.rules ?? DEFAULT_BATTLE_RULES;
  if (!deckContainsLocation(input.playerDeck) || !deckContainsLocation(input.aiDeck)) {
    throw new Error("Both decks must contain at least one Location card.");
  }

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
    openingResolved: true,
  };

  // Locations never enter either player's draw deck — both players'
  // Location cards are pulled out here and pooled into one shared,
  // shuffled location deck that auto-seats every lane (at setup, and again
  // whenever a capture clears one), instead of being played from hand.
  const { mainDeck: playerMainDeck, locationDeck: playerLocations } = splitExpandedDeck(
    input.playerDeck,
  );
  const { mainDeck: aiMainDeck, locationDeck: aiLocations } = splitExpandedDeck(input.aiDeck);

  const shuffledPlayer = shuffle(playerMainDeck, state);
  state = { ...state, ...shuffledPlayer.state, player: defaultPlayerState(shuffledPlayer.items) };

  const shuffledAi = shuffle(aiMainDeck, state);
  state = { ...state, ...shuffledAi.state, ai: defaultPlayerState(shuffledAi.items) };

  const shuffledLocations = shuffle([...playerLocations, ...aiLocations], state);
  state = { ...state, ...shuffledLocations.state, locationDeck: shuffledLocations.items };
  state = appendLog(
    state,
    "location_deck_shuffled",
    `The location deck is shuffled with ${state.locationDeck.length} Locations from both players.`,
  );

  state = initLanes(state, rules);
  for (let laneIndex = 0; laneIndex < rules.activeLaneCount; laneIndex++) {
    state = seatLocationFromDeck(state, laneIndex);
  }

  state = dealOpeningHand(state, "player", rules);
  state = dealOpeningHand(state, "ai", rules);

  return beginFirstTurn(state, rules);
}

export function beginChronosPhase(
  state: MatchState,
  rules: BattleRules = DEFAULT_BATTLE_RULES,
): MatchState {
  const player = state.activePlayer;
  let next: MatchState = { ...state, phase: "chronos" };

  const cp = cpForTurn(next.turnNumber, rules);
  const ps = playerState(next, player);
  next = setPlayerState(next, player, {
    ...ps,
    cp,
    cpGrantedThisTurn: cp,
    eventsPlayedThisTurn: 0,
    hasEstablishedInfluenceThisTurn: false,
    hasUsedUnificationThisTurn: false,
    deployCostReductionUses: ps.deployCostReduction > 0 ? ps.deployCostReductionUses : 0,
  });

  // Reset unit commitment at Chronos
  next = {
    ...next,
    lanes: next.lanes.map((lane) => ({
      ...lane,
      captureResolvedThisTurn: false,
      playerUnits: lane.playerUnits.map((u) =>
        u.owner === player && u.committedUntilTurn != null && u.committedUntilTurn <= next.turnNumber
          ? {
              ...u,
              isCommitted: false,
              committedUntilTurn: null,
              cannotAttack: false,
              cannotEstablishInfluence: false,
            }
          : u,
      ),
      aiUnits: lane.aiUnits.map((u) =>
        u.owner === player && u.committedUntilTurn != null && u.committedUntilTurn <= next.turnNumber
          ? {
              ...u,
              isCommitted: false,
              committedUntilTurn: null,
              cannotAttack: false,
              cannotEstablishInfluence: false,
            }
          : u,
      ),
    })),
  };

  const drawResult = drawCardsWithExhaustion(next, player, 1, rules);
  next = drawResult.state;

  const scholars = Math.min(scholarCountForPlayer(next, player), rules.scholarBonusDrawCap);
  if (scholars > 0) {
    const scholarDraw = drawCardsWithExhaustion(next, player, scholars, rules);
    next = scholarDraw.state;
    next = appendLog(
      next,
      "scholar_draw",
      `${player} draws ${scholars} extra card(s) from Scholar(s).`,
    );
  }

  if (drawResult.exhausted) {
    const updatedPs = playerState(next, player);
    const failed = updatedPs.failedChronosDraws + 1;
    next = setPlayerState(next, player, { ...updatedPs, failedChronosDraws: failed });
    next = appendLog(
      next,
      "deck_exhausted",
      `${player} cannot draw — Historical Exhaustion warning (${failed}/${rules.failedChronosDrawsToLose}).`,
    );
    if (failed >= rules.failedChronosDrawsToLose) {
      const winner = player === "player" ? "ai" : "player";
      next = appendLog(
        {
          ...next,
          winner,
          status: winner === "player" ? "won" : "lost",
        },
        "historical_exhaustion",
        `${player} succumbs to Historical Exhaustion. ${winner} wins!`,
      );
      return next;
    }
  } else {
    const updatedPs = playerState(next, player);
    if (updatedPs.failedChronosDraws > 0) {
      next = setPlayerState(next, player, { ...updatedPs, failedChronosDraws: 0, deckExhausted: false });
    }
  }

  next = appendLog(next, "chronos", `${player} receives ${cp} CP and draws.`);
  return next;
}

export function addCpToPlayer(
  state: MatchState,
  player: PlayerId,
  amount: number,
  rules: BattleRules,
): MatchState {
  const ps = playerState(state, player);
  return setPlayerState(state, player, {
    ...ps,
    cp: applyCpGain(ps.cp, amount, rules),
  });
}
