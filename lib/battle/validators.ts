import { DEFAULT_BATTLE_RULES, isMainDeckType, isLocationDeckType } from "@/lib/battle/constants";
import {
  countCardsByType,
  deckCompositionFor,
  validateDeckTypeCounts,
} from "@/lib/battle/deck-composition";
import {
  eventNeedsEnemyTarget,
  eventNeedsFriendlyTarget,
  eventNeedsLane,
} from "@/lib/battle/effects";
import type {
  BattleAction,
  BattleRules,
  CardSnapshot,
  MatchState,
  Phase,
  PlayerId,
} from "@/lib/battle/types";
import { opponentOf, playerState, unitsInLane } from "@/lib/battle/types";
import { isValidAttackTarget, hasUnificationAbility } from "@/lib/battle/abilities";

export type DeckValidationResult = {
  valid: boolean;
  errors: string[];
  totalCards: number;
};

export function splitExpandedDeck(cards: CardSnapshot[]): {
  mainDeck: CardSnapshot[];
  locationDeck: CardSnapshot[];
} {
  const mainDeck: CardSnapshot[] = [];
  const locationDeck: CardSnapshot[] = [];
  for (const card of cards) {
    if (card.cardType === "location") locationDeck.push(card);
    else mainDeck.push(card);
  }
  return { mainDeck, locationDeck };
}

export function validateDeckComposition(
  entries: { characterId: number; quantity: number; cardType: string }[],
  rules: BattleRules = DEFAULT_BATTLE_RULES,
): DeckValidationResult {
  const errors: string[] = [];
  let totalCards = 0;
  const counts = new Map<number, number>();

  for (const entry of entries) {
    if (entry.cardType === "location") {
      if (!isLocationDeckType(entry.cardType)) {
        errors.push(`Card #${entry.characterId} is not a valid location card.`);
      }
    } else if (!isMainDeckType(entry.cardType)) {
      errors.push(
        `Card #${entry.characterId} has type "${entry.cardType}" — only character, unit, event, and location allowed.`,
      );
    }
    if (entry.quantity < 1 || entry.quantity > rules.maxCopiesPerCard) {
      errors.push(`Card #${entry.characterId} has invalid copy count (${entry.quantity}).`);
    }
    totalCards += entry.quantity;
    counts.set(entry.characterId, entry.quantity);
  }

  if (totalCards !== rules.deckSize) {
    errors.push(`Deck must contain exactly ${rules.deckSize} cards (currently ${totalCards}).`);
  }

  if (totalCards === rules.deckSize) {
    const typeCounts = countCardsByType(entries);
    errors.push(...validateDeckTypeCounts(typeCounts, deckCompositionFor(rules)));
  }

  for (const [id, qty] of counts) {
    if (qty > rules.maxCopiesPerCard) {
      errors.push(`Card #${id} exceeds max ${rules.maxCopiesPerCard} copies.`);
    }
  }

  return { valid: errors.length === 0, errors, totalCards };
}

export function expandDeckList(cards: CardSnapshot[], quantities: Map<number, number>): CardSnapshot[] {
  const deck: CardSnapshot[] = [];
  for (const card of cards) {
    const qty = quantities.get(card.characterId) ?? 0;
    for (let i = 0; i < qty; i++) deck.push(card);
  }
  return deck;
}

function activePlayerCanAct(state: MatchState, actor: PlayerId): boolean {
  return state.activePlayer === actor && state.status === "active";
}

export function getLegalActions(
  state: MatchState,
  actor: PlayerId,
  rules: BattleRules = DEFAULT_BATTLE_RULES,
): BattleAction[] {
  if (!activePlayerCanAct(state, actor)) return [];
  if (state.pendingChoice) {
    return [{ type: "resolve_choice" as const }];
  }
  const ps = playerState(state, actor);
  const actions: BattleAction[] = [];

  if (state.phase === "opening") {
    actions.push({ type: "end_phase" });
    return actions;
  }

  if (state.phase === "logistics") {
    if (!ps.hasEstablishedInfluenceThisTurn && rules.maxEstablishInfluencePerTurn > 0) {
      state.lanes.forEach((lane, laneIndex) => {
        if (!lane.location || lane.captureResolvedThisTurn) return;
        if (playerState(state, opponentOf(actor)).opponentInfluenceBlocked) return;
        const ready = unitsInLane(lane, actor).filter(
          (u) =>
            u.currentDefense > 0 &&
            !u.summoningSickness &&
            !u.isCommitted &&
            !u.cannotEstablishInfluence,
        );
        ready.forEach((unit) => {
          actions.push({
            type: "establish_influence",
            laneIndex,
            unitInstanceId: unit.instanceId,
          });
        });
      });
    }

    if (!ps.hasUsedUnificationThisTurn) {
      state.lanes.forEach((lane, laneIndex) => {
        if (!lane.location) return;
        const units = unitsInLane(lane, actor);
        const monarchs = units.filter((u) =>
          hasUnificationAbility({ abilityName: u.abilityName } as import("@/lib/battle/types").CardSnapshot),
        );
        for (const monarch of monarchs) {
          for (const target of units) {
            if (target.instanceId === monarch.instanceId) continue;
            actions.push({
              type: "unification",
              laneIndex,
              monarchInstanceId: monarch.instanceId,
              targetInstanceId: target.instanceId,
            });
          }
        }
      });
    }

    ps.hand.forEach((card, handIndex) => {
      if (card.cardType === "location") {
        if (card.cost > ps.cp) return;
        for (let laneIndex = 0; laneIndex < state.lanes.length; laneIndex++) {
          actions.push({ type: "play_location", handIndex, laneIndex });
        }
        return;
      }

      if (card.cardType === "event") {
        if (ps.eventsPlayedThisTurn >= rules.maxEventsPerTurn) return;
        if (card.cost > ps.cp) return;
        const effect = card.abilityEffect;

        if (effect === "scry" && ps.deck.length > 0) {
          actions.push({ type: "play_event", handIndex });
          return;
        }

        if (effect === "search_deck" && ps.deck.some((c) => c.cardType === "character" || c.cardType === "unit")) {
          actions.push({ type: "play_event", handIndex });
          return;
        }

        if (effect === "discard_to_hand" && ps.discard.length > 0) {
          actions.push({ type: "play_event", handIndex });
          return;
        }

        if (effect === "discard_draw" && ps.hand.length > 1) {
          actions.push({ type: "play_event", handIndex });
          return;
        }

        if (effect === "vs_lower_rarity_attack" || effect === "cost_reduction" || effect === "block_influence_gain") {
          actions.push({ type: "play_event", handIndex });
          return;
        }

        if (eventNeedsLane(effect)) {
          for (let laneIndex = 0; laneIndex < state.lanes.length; laneIndex++) {
            const lane = state.lanes[laneIndex];
            if (!lane?.location) continue;

            if (eventNeedsEnemyTarget(effect)) {
              const enemies = unitsInLane(lane, opponentOf(actor));
              enemies.forEach((enemy) => {
                actions.push({
                  type: "play_event",
                  handIndex,
                  laneIndex,
                  targetInstanceId: enemy.instanceId,
                });
              });
            } else if (eventNeedsFriendlyTarget(effect)) {
              const friendlies = unitsInLane(lane, actor);
              friendlies.forEach((friendly) => {
                actions.push({
                  type: "play_event",
                  handIndex,
                  laneIndex,
                  targetInstanceId: friendly.instanceId,
                });
              });
            } else if (effect === "remove_influence") {
              const opponentInfluence =
                opponentOf(actor) === "player" ? lane.playerInfluence : lane.aiInfluence;
              if (opponentInfluence > 0) {
                actions.push({ type: "play_event", handIndex, laneIndex });
              }
            } else if (effect === "replace_location") {
              if (ps.hand.some((c) => c.cardType === "location")) {
                actions.push({ type: "play_event", handIndex, laneIndex });
              }
            } else {
              actions.push({ type: "play_event", handIndex, laneIndex });
            }
          }
          return;
        }

        actions.push({ type: "play_event", handIndex });
        return;
      }

      if (card.cardType !== "character" && card.cardType !== "unit") return;
      const effectiveCost = Math.max(0, card.cost - ps.deployCostReduction);
      if (effectiveCost > ps.cp) return;
      for (let laneIndex = 0; laneIndex < state.lanes.length; laneIndex++) {
        if (!state.lanes[laneIndex]?.location) continue;
        actions.push({ type: "deploy_unit", handIndex, laneIndex });
      }
    });
    actions.push({ type: "end_phase" });
  }

  if (state.phase === "campaign") {
    state.lanes.forEach((lane, laneIndex) => {
      if (!lane.location) return;
      const attackers = lane[actor === "player" ? "playerUnits" : "aiUnits"].filter(
        (u) =>
          !u.summoningSickness &&
          !u.cannotAttack &&
          !u.isCommitted &&
          u.currentDefense > 0,
      );
      const defenders = lane[actor === "player" ? "aiUnits" : "playerUnits"].filter(
        (u) => u.currentDefense > 0,
      );
      if (attackers.length === 0 || defenders.length === 0) return;

      const defenderOwner = opponentOf(actor);
      for (const attacker of attackers) {
        for (const defender of defenders) {
          if (!isValidAttackTarget(lane, defender, defenderOwner, defender)) continue;
          actions.push({
            type: "attack",
            laneIndex,
            attackerInstanceId: attacker.instanceId,
            defenderInstanceId: defender.instanceId,
          });
        }
      }
    });
    actions.push({ type: "end_phase" });
  }

  if (state.phase === "chronos" || state.phase === "consolidation") {
    actions.push({ type: "end_phase" });
  }

  return actions;
}

export function canAttackTarget(
  state: MatchState,
  actor: PlayerId,
  laneIndex: number,
  attackerInstanceId: string,
  defenderInstanceId: string,
  rules: BattleRules = DEFAULT_BATTLE_RULES,
): boolean {
  void rules;
  return getLegalActions(state, actor).some(
    (a) =>
      a.type === "attack" &&
      a.laneIndex === laneIndex &&
      a.attackerInstanceId === attackerInstanceId &&
      a.defenderInstanceId === defenderInstanceId,
  );
}

export function findUnitInLane(
  state: MatchState,
  laneIndex: number,
  instanceId: string,
): { unit: import("@/lib/battle/types").BoardUnit; owner: PlayerId } | null {
  const lane = state.lanes[laneIndex];
  if (!lane) return null;
  for (const owner of ["player", "ai"] as PlayerId[]) {
    const units = owner === "player" ? lane.playerUnits : lane.aiUnits;
    const unit = units.find((u) => u.instanceId === instanceId);
    if (unit) return { unit, owner };
  }
  return null;
}

export function clearPendingEvents(state: MatchState): MatchState {
  return { ...state, pendingEvents: [] };
}

export function nextPhase(phase: Phase): Phase {
  switch (phase) {
    case "opening":
      return "chronos";
    case "chronos":
      return "logistics";
    case "logistics":
      return "campaign";
    case "campaign":
      return "consolidation";
    case "consolidation":
      return "chronos";
  }
}
