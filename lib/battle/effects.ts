import { DEFAULT_BATTLE_RULES } from "@/lib/battle/constants";
import { applyLocationToLane } from "@/lib/battle/locations";
import { applyLaneTempBuff, removeDeadUnits, updateUnitInLane } from "@/lib/battle/phases/logistics";
import {
  appendLog,
  drawCards,
  peekDeckTop,
  putCardOnDeckTop,
  reorderDeckTop,
  shufflePlayerDeck,
} from "@/lib/battle/rng";
import type {
  AbilityEffect,
  BattleRules,
  CardSnapshot,
  MatchState,
  PendingChoice,
  PlayEventAction,
  PlayerId,
  ResolveChoiceAction,
} from "@/lib/battle/types";
import {
  opponentOf,
  playerState,
  setInfluenceForLane,
  setPlayerState,
  setUnitsInLane,
  unitsInLane,
} from "@/lib/battle/types";

export function eventNeedsLane(effect: AbilityEffect | null): boolean {
  return (
    effect === "flat_attack" ||
    effect === "flat_defense" ||
    effect === "vs_higher_rarity_attack" ||
    effect === "heal_unit" ||
    effect === "add_influence" ||
    effect === "remove_influence" ||
    effect === "replace_location"
  );
}

export function eventNeedsFriendlyTarget(effect: AbilityEffect | null): boolean {
  return effect === "heal_unit";
}

export function eventNeedsEnemyTarget(effect: AbilityEffect | null): boolean {
  return effect === "vs_higher_rarity_attack";
}

export function eventIsImmediate(effect: AbilityEffect | null): boolean {
  return (
    effect === "flat_attack" ||
    effect === "flat_defense" ||
    effect === "vs_lower_rarity_attack" ||
    effect === "cost_reduction" ||
    effect === "block_influence_gain" ||
    effect === "add_influence" ||
    effect === "remove_influence" ||
    effect === "replace_location" ||
    effect === "vs_higher_rarity_attack" ||
    effect === "heal_unit"
  );
}

function finishEvent(
  state: MatchState,
  player: PlayerId,
  card: CardSnapshot,
  cp: number,
  eventsPlayed: number,
): MatchState {
  const ps = playerState(state, player);
  let next = setPlayerState(state, player, {
    ...ps,
    cp,
    eventsPlayedThisTurn: eventsPlayed,
    discard: [...ps.discard, card],
  });
  return next;
}

export function startPendingChoice(
  state: MatchState,
  player: PlayerId,
  choice: PendingChoice,
): MatchState {
  return { ...state, pendingChoice: choice };
}

export function applyEventEffect(
  state: MatchState,
  player: PlayerId,
  card: CardSnapshot,
  action: PlayEventAction,
  rules: BattleRules = DEFAULT_BATTLE_RULES,
): MatchState | null {
  const effect = card.abilityEffect;
  const value = card.abilityValue ?? 0;
  const ps = playerState(state, player);
  let cp = ps.cp - card.cost;
  const laneIndex = action.laneIndex ?? 0;
  const lane = state.lanes[laneIndex];

  if (effect === "vs_lower_rarity_attack") {
    cp += value;
    let next = finishEvent(state, player, card, cp, ps.eventsPlayedThisTurn + 1);
    next = appendLog(next, "event", `${player} plays ${card.name}: gains ${value} CP.`);
    return next;
  }

  if (effect === "scry") {
    const count = Math.max(1, value || 2);
    const revealed = peekDeckTop(state, player, count);
    if (revealed.length === 0) return null;
    let next = finishEvent(state, player, card, cp, ps.eventsPlayedThisTurn + 1);
    next = startPendingChoice(next, player, {
      kind: "scry",
      player,
      revealedCards: revealed,
      eventName: card.name,
    });
    next = appendLog(next, "event", `${player} plays ${card.name}: scry ${revealed.length}.`);
    return next;
  }

  if (effect === "search_deck") {
    const count = Math.max(1, value || 5);
    const revealed = peekDeckTop(state, player, count);
    if (revealed.length === 0) return null;
    const pickable = revealed.filter((c) => c.cardType === "character" || c.cardType === "unit");
    if (pickable.length === 0) return null;
    let next = finishEvent(state, player, card, cp, ps.eventsPlayedThisTurn + 1);
    next = startPendingChoice(next, player, {
      kind: "search_deck",
      player,
      revealedCards: revealed,
      eventName: card.name,
    });
    next = appendLog(next, "event", `${player} plays ${card.name}: search deck.`);
    return next;
  }

  if (effect === "discard_to_hand") {
    if (ps.discard.length === 0) return null;
    let next = finishEvent(state, player, card, cp, ps.eventsPlayedThisTurn + 1);
    next = startPendingChoice(next, player, {
      kind: "discard_to_hand",
      player,
      revealedCards: [...ps.discard],
      eventName: card.name,
    });
    next = appendLog(next, "event", `${player} plays ${card.name}: recall from discard.`);
    return next;
  }

  if (effect === "discard_draw") {
    if (ps.hand.length === 0) return null;
    let next = setPlayerState(state, player, { ...ps, cp });
    next = startPendingChoice(next, player, {
      kind: "discard_draw",
      player,
      revealedCards: [...playerState(next, player).hand],
      eventName: card.name,
      spentEventCard: card,
    });
    next = appendLog(next, "event", `${player} plays ${card.name}: discard to draw.`);
    return next;
  }

  if (!lane || !lane.location) return null;

  if (effect === "flat_attack" && value) {
    const lanes = [...state.lanes];
    lanes[laneIndex] = applyLaneTempBuff(lane, player, value, 0);
    let next = finishEvent({ ...state, lanes }, player, card, cp, ps.eventsPlayedThisTurn + 1);
    next = appendLog(next, "event", `${player} plays ${card.name}: +${value} ATK in lane.`);
    return next;
  }

  if (effect === "flat_defense" && value) {
    const lanes = [...state.lanes];
    lanes[laneIndex] = applyLaneTempBuff(lane, player, 0, value);
    let next = finishEvent({ ...state, lanes }, player, card, cp, ps.eventsPlayedThisTurn + 1);
    next = appendLog(next, "event", `${player} plays ${card.name}: +${value} DEF in lane.`);
    return next;
  }

  if (effect === "vs_higher_rarity_attack" && value) {
    const enemies = unitsInLane(lane, opponentOf(player));
    const target = enemies.find((u) => u.instanceId === action.targetInstanceId);
    if (!target) return null;
    const lanes = [...state.lanes];
    const updated = enemies.map((u) =>
      u.instanceId === target.instanceId
        ? { ...u, currentDefense: u.currentDefense - value }
        : u,
    );
    lanes[laneIndex] = setUnitsInLane(lane, opponentOf(player), updated.filter((u) => u.currentDefense > 0));
    let next = finishEvent({ ...state, lanes }, player, card, cp, ps.eventsPlayedThisTurn + 1);
    next = appendLog(next, "event", `${player} plays ${card.name}: ${target.name} takes ${value} damage.`);
    return next;
  }

  if (effect === "heal_unit" && value) {
    const friendlies = unitsInLane(lane, player);
    const target = friendlies.find((u) => u.instanceId === action.targetInstanceId);
    if (!target) return null;
    const lanes = updateUnitInLane(state.lanes, laneIndex, target.instanceId, (u) => ({
      ...u,
      currentDefense: Math.min(u.baseDefense + u.eraSynergyBonus, u.currentDefense + value),
    }));
    let next = finishEvent({ ...state, lanes }, player, card, cp, ps.eventsPlayedThisTurn + 1);
    next = appendLog(next, "event", `${player} plays ${card.name}: ${target.name} heals ${value} DEF.`);
    return next;
  }

  if (effect === "add_influence") {
    const current = player === "player" ? lane.playerInfluence : lane.aiInfluence;
    const lanes = [...state.lanes];
    lanes[laneIndex] = setInfluenceForLane(lane, player, current + Math.max(1, value || 1));
    let next = finishEvent({ ...state, lanes }, player, card, cp, ps.eventsPlayedThisTurn + 1);
    next = appendLog(next, "event", `${player} plays ${card.name}: gains influence on ${lane.location.name}.`);
    return next;
  }

  if (effect === "remove_influence") {
    const opponent = opponentOf(player);
    const current = opponent === "player" ? lane.playerInfluence : lane.aiInfluence;
    const lanes = [...state.lanes];
    lanes[laneIndex] = setInfluenceForLane(lane, opponent, Math.max(0, current - Math.max(1, value || 1)));
    let next = finishEvent({ ...state, lanes }, player, card, cp, ps.eventsPlayedThisTurn + 1);
    next = appendLog(next, "event", `${player} plays ${card.name}: erodes enemy influence.`);
    return next;
  }

  if (effect === "cost_reduction") {
    let next = setPlayerState(state, player, {
      ...ps,
      cp,
      deployCostReduction: ps.deployCostReduction + Math.max(1, value || 10),
      eventsPlayedThisTurn: ps.eventsPlayedThisTurn + 1,
      discard: [...ps.discard, card],
    });
    next = appendLog(next, "event", `${player} plays ${card.name}: next deploy costs ${value || 10} less CP.`);
    return next;
  }

  if (effect === "block_influence_gain") {
    let next = setPlayerState(state, player, {
      ...ps,
      cp,
      opponentInfluenceBlocked: true,
      eventsPlayedThisTurn: ps.eventsPlayedThisTurn + 1,
      discard: [...ps.discard, card],
    });
    next = appendLog(next, "event", `${player} plays ${card.name}: enemy cannot gain influence this turn.`);
    return next;
  }

  if (effect === "replace_location") {
    const handIndex = ps.hand.findIndex((c) => c.cardType === "location");
    if (handIndex < 0) return null;
    const locationCard = ps.hand[handIndex]!;
    const hand = ps.hand.filter((_, i) => i !== handIndex);
    let next = setPlayerState(state, player, {
      ...ps,
      hand,
      cp,
      eventsPlayedThisTurn: ps.eventsPlayedThisTurn + 1,
      discard: [...ps.discard, card],
    });
    next = applyLocationToLane(next, player, laneIndex, locationCard);
    if (!next) return null;
    next = appendLog(
      next,
      "event",
      `${player} plays ${card.name}: ${lane.location?.name ?? "location"} replaced by ${locationCard.name} from hand.`,
    );
    return next;
  }

  void rules;
  return null;
}

export function resolvePendingChoice(
  state: MatchState,
  player: PlayerId,
  action: ResolveChoiceAction,
): MatchState | null {
  const choice = state.pendingChoice;
  if (!choice || choice.player !== player) return null;

  if (choice.kind === "scry") {
    const topIndices = action.topIndices ?? choice.revealedCards.map((_, i) => i);
    if (topIndices.length !== choice.revealedCards.length) return null;
    let next = reorderDeckTop(state, player, choice.revealedCards.length, topIndices);
    next = { ...next, pendingChoice: null };
    next = appendLog(next, "scry", `${player} orders the top ${choice.revealedCards.length} cards.`);
    return next;
  }

  if (choice.kind === "search_deck") {
    const index = action.selectedIndex;
    if (index == null || index < 0 || index >= choice.revealedCards.length) return null;
    const picked = choice.revealedCards[index]!;
    if (picked.cardType !== "character" && picked.cardType !== "unit") return null;
    const ps = playerState(state, player);
    const deck = [...ps.deck];
    deck.splice(0, choice.revealedCards.length);
    const rest = choice.revealedCards.filter((_, i) => i !== index);
    let next = setPlayerState(state, player, {
      ...ps,
      deck: [...rest, ...deck],
      hand: [...ps.hand, picked],
    });
    next = shufflePlayerDeck(next, player);
    next = { ...next, pendingChoice: null };
    next = appendLog(next, "search", `${player} adds ${picked.name} to hand.`);
    return next;
  }

  if (choice.kind === "discard_to_hand") {
    const index = action.selectedIndex;
    if (index == null || index < 0 || index >= choice.revealedCards.length) return null;
    const picked = choice.revealedCards[index]!;
    const ps = playerState(state, player);
    let removed = false;
    const discard = ps.discard.filter((c) => {
      if (!removed && c.characterId === picked.characterId && c.seed === picked.seed) {
        removed = true;
        return false;
      }
      return true;
    });
    let next = setPlayerState(state, player, {
      ...ps,
      discard,
      hand: [...ps.hand, picked],
    });
    next = { ...next, pendingChoice: null };
    next = appendLog(next, "recall", `${player} returns ${picked.name} to hand.`);
    return next;
  }

  if (choice.kind === "discard_draw") {
    const index = action.selectedIndex;
    if (index == null || index < 0 || index >= choice.revealedCards.length) return null;
    const ps = playerState(state, player);
    const hand = [...ps.hand];
    const [discarded] = hand.splice(index, 1);
    if (!discarded) return null;
    const spent = choice.spentEventCard;
    let next = setPlayerState(state, player, {
      ...ps,
      hand,
      discard: spent ? [...ps.discard, discarded, spent] : [...ps.discard, discarded],
      eventsPlayedThisTurn: ps.eventsPlayedThisTurn + 1,
    });
    next = drawCards(next, player, 2);
    next = { ...next, pendingChoice: null };
    next = appendLog(next, "event", `${player} discards ${discarded.name} and draws 2.`);
    return next;
  }

  return null;
}

export function autoResolvePendingChoice(state: MatchState, player: PlayerId): MatchState | null {
  const choice = state.pendingChoice;
  if (!choice || choice.player !== player) return null;

  if (choice.kind === "scry") {
    return resolvePendingChoice(state, player, {
      type: "resolve_choice",
      topIndices: choice.revealedCards.map((_, i) => i),
    });
  }

  if (choice.kind === "search_deck") {
    const pickable = choice.revealedCards.findIndex(
      (c) => c.cardType === "character" || c.cardType === "unit",
    );
    if (pickable < 0) return resolvePendingChoice(state, player, { type: "resolve_choice", selectedIndex: 0 });
    return resolvePendingChoice(state, player, { type: "resolve_choice", selectedIndex: pickable });
  }

  if (choice.kind === "discard_to_hand") {
    return resolvePendingChoice(state, player, { type: "resolve_choice", selectedIndex: 0 });
  }

  if (choice.kind === "discard_draw") {
    const ps = playerState(state, player);
    let worstIndex = 0;
    let worstCost = -1;
    ps.hand.forEach((card, index) => {
      if (card.cost > worstCost) {
        worstCost = card.cost;
        worstIndex = index;
      }
    });
    return resolvePendingChoice(state, player, { type: "resolve_choice", selectedIndex: worstIndex });
  }

  return null;
}
