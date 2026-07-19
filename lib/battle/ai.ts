import { DEFAULT_BATTLE_RULES } from "@/lib/battle/constants";
import { eraSynergyBonus } from "@/lib/battle/abilities";
import { getLegalActions } from "@/lib/battle/validators";
import type { BattleAction, BattleRules, CardSnapshot, MatchState } from "@/lib/battle/types";
import { opponentOf, playerState, unitsInLane } from "@/lib/battle/types";

function scoreEventAction(
  state: MatchState,
  action: Extract<BattleAction, { type: "play_event" }>,
  rules: BattleRules,
): number {
  const ps = playerState(state, "ai");
  const card = ps.hand[action.handIndex];
  if (!card) return -Infinity;

  const effect = card.abilityEffect;
  const value = card.abilityValue ?? 0;
  const laneIndex = action.laneIndex ?? 0;
  const lane = state.lanes[laneIndex];
  let score = 10 - card.cost * 0.05;

  if (effect === "vs_lower_rarity_attack") return score + value;
  if (effect === "cost_reduction") {
    const hasDeploy = ps.hand.some(
      (c, i) =>
        i !== action.handIndex &&
        (c.cardType === "character" || c.cardType === "unit") &&
        c.cost - ps.deployCostReduction > ps.cp - card.cost,
    );
    return score + (hasDeploy ? value + 15 : value * 0.5);
  }
  if (effect === "block_influence_gain") {
    const playerUnits = lane ? unitsInLane(lane, "player").length : 0;
    return score + (playerUnits === 0 ? 25 : 8);
  }
  if (effect === "scry" || effect === "search_deck") return score + 12;
  if (effect === "discard_to_hand") return score + 14;
  if (effect === "discard_draw" && ps.hand.length > 2) return score + 10;

  if (lane?.location) {
    if (effect === "add_influence") {
      const aiUnits = unitsInLane(lane, "ai").length;
      return score + (aiUnits > 0 ? value + 18 : value + 5);
    }
    if (effect === "remove_influence") {
      const playerInfluence = lane.playerInfluence;
      return score + playerInfluence * 12;
    }
    if (effect === "heal_unit" && action.targetInstanceId) {
      const target = unitsInLane(lane, "ai").find((u) => u.instanceId === action.targetInstanceId);
      if (!target) return -Infinity;
      const missing = target.baseDefense + target.eraSynergyBonus - target.currentDefense;
      return score + Math.min(missing, value) * 1.5;
    }
    if (effect === "vs_higher_rarity_attack" && action.targetInstanceId) {
      const target = unitsInLane(lane, "player").find((u) => u.instanceId === action.targetInstanceId);
      if (!target) return -Infinity;
      return score + Math.min(target.currentDefense, value) * 2;
    }
    if (effect === "flat_attack" || effect === "flat_defense") {
      const aiUnits = unitsInLane(lane, "ai").length;
      return score + aiUnits * (value * 0.4);
    }
    if (effect === "replace_location" && lane.playerInfluence >= 2) {
      return score + 20;
    }
  }

  void rules;
  return score;
}

export function chooseAiAction(
  state: MatchState,
  rules: BattleRules = DEFAULT_BATTLE_RULES,
): BattleAction | null {
  const legal = getLegalActions(state, "ai", rules);
  if (legal.length === 0) return null;

  if (state.phase === "chronos" || state.phase === "consolidation") {
    return { type: "end_phase" };
  }

  if (state.phase === "logistics") {
    const playLocations = legal.filter(
      (a): a is Extract<BattleAction, { type: "play_location" }> => a.type === "play_location",
    );
    if (playLocations.length > 0) {
      const lane = state.lanes[0];
      if (!lane?.location) {
        return playLocations[0]!;
      }
      if (lane.playerInfluence >= 2) {
        return playLocations[0]!;
      }
    }

    const ps = playerState(state, "ai");
    const deploys = legal.filter((a): a is Extract<BattleAction, { type: "deploy_unit" }> => a.type === "deploy_unit");
    const events = legal.filter((a): a is Extract<BattleAction, { type: "play_event" }> => a.type === "play_event");

    if (events.length > 0) {
      let bestEvent = events[0]!;
      let bestEventScore = -Infinity;
      for (const action of events) {
        const eventScore = scoreEventAction(state, action, rules);
        if (eventScore > bestEventScore) {
          bestEventScore = eventScore;
          bestEvent = action;
        }
      }
      if (bestEventScore >= 15 || (ps.cp >= 80 && bestEventScore >= 8)) {
        return bestEvent;
      }
    }

    if (deploys.length > 0) {
      let best = deploys[0]!;
      let bestScore = -Infinity;
      for (const action of deploys) {
        const card = ps.hand[action.handIndex];
        if (!card) continue;
        const lane = state.lanes[action.laneIndex];
        if (!lane?.location) continue;
        const synergy = eraSynergyBonus(card, lane.location);
        const effectiveCost = Math.max(0, card.cost - ps.deployCostReduction);
        const score = card.attack + card.defense + synergy - effectiveCost * 0.1;
        if (score > bestScore) {
          bestScore = score;
          best = action;
        }
      }
      return best;
    }

    if (events.length > 0) return events[0]!;

    return { type: "end_phase" };
  }

  if (state.phase === "campaign") {
    const attacks = legal.filter((a): a is Extract<BattleAction, { type: "attack" }> => a.type === "attack");
    if (attacks.length > 0) {
      let best = attacks[0]!;
      let bestScore = -Infinity;
      for (const action of attacks) {
        const lane = state.lanes[action.laneIndex];
        if (!lane) continue;
        const attacker = unitsInLane(lane, "ai").find((u) => u.instanceId === action.attackerInstanceId);
        const defender = unitsInLane(lane, "player").find((u) => u.instanceId === action.defenderInstanceId);
        if (!attacker || !defender) continue;
        const score = attacker.baseAttack - defender.currentDefense * 0.5;
        if (score > bestScore) {
          bestScore = score;
          best = action;
        }
      }
      return best;
    }
    return { type: "end_phase" };
  }

  return { type: "end_phase" };
}

export function buildAiDeckFromPool(pool: CardSnapshot[], rules: BattleRules = DEFAULT_BATTLE_RULES): CardSnapshot[] {
  const playable = pool.filter(
    (c) => c.cardType === "character" || c.cardType === "unit" || c.cardType === "event",
  );
  if (playable.length === 0) return [];

  const deck: CardSnapshot[] = [];
  let i = 0;
  while (deck.length < rules.deckSize) {
    deck.push(playable[i % playable.length]!);
    i++;
  }
  return deck;
}
