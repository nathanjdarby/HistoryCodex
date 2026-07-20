import { DEFAULT_BATTLE_RULES } from "@/lib/battle/constants";
import { buildAiDeckFromPool as buildDeck } from "@/lib/battle/ai-deck";
import { eraSynergyBonus } from "@/lib/battle/abilities";
import { getLegalActions } from "@/lib/battle/validators";
import type { BattleAction, BattleRules, CardSnapshot, MatchState } from "@/lib/battle/types";
import { opponentOf, playerState, unitsInLane } from "@/lib/battle/types";

export { buildAiDeckFromPool } from "@/lib/battle/ai-deck";

function scoreEstablishInfluence(state: MatchState, action: Extract<BattleAction, { type: "establish_influence" }>, rules: BattleRules): number {
  const lane = state.lanes[action.laneIndex];
  if (!lane?.location) return -Infinity;
  const influence = lane.aiInfluence;
  const score = 20 + influence * 15;
  if (influence + 1 >= rules.influenceToCapture) return score + 50;
  if (lane.playerInfluence + 1 >= rules.influenceToCapture) return score + 30;
  return score;
}

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
      return score + lane.playerInfluence * 12;
    }
    if (effect === "heal_unit" && action.targetInstanceId) {
      const target = unitsInLane(lane, "ai").find((u) => u.instanceId === action.targetInstanceId);
      if (!target) return -Infinity;
      const missing = target.baseDefense - target.currentDefense;
      return score + Math.min(missing, value) * 1.5;
    }
    if (effect === "vs_higher_rarity_attack" && action.targetInstanceId) {
      const target = unitsInLane(lane, "player").find((u) => u.instanceId === action.targetInstanceId);
      if (!target) return -Infinity;
      return score + Math.min(target.currentDefense, value) * 2;
    }
    if (effect === "flat_attack" || effect === "flat_defense") {
      return score + unitsInLane(lane, "ai").length * (value * 0.4);
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
    const lane = state.lanes[0];
    const locationCountInHand = playerState(state, "ai").hand.filter((c) => c.cardType === "location").length;

    if (playLocations.length > 0 && !lane?.location) {
      return playLocations[0]!;
    }

    if (playLocations.length > 0 && lane?.location && lane.playerInfluence >= 2 && locationCountInHand > 1) {
      return playLocations[0]!;
    }

    const establish = legal.filter(
      (a): a is Extract<BattleAction, { type: "establish_influence" }> => a.type === "establish_influence",
    );
    if (establish.length > 0) {
      let best = establish[0]!;
      let bestScore = -Infinity;
      for (const action of establish) {
        const s = scoreEstablishInfluence(state, action, rules);
        if (s > bestScore) {
          bestScore = s;
          best = action;
        }
      }
      if (bestScore >= 25) return best;
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

    if (establish.length > 0 && !deploys.length) {
      return establish[0]!;
    }

    if (deploys.length > 0) {
      let best = deploys[0]!;
      let bestScore = -Infinity;
      for (const action of deploys) {
        const card = ps.hand[action.handIndex];
        if (!card) continue;
        const deployLane = state.lanes[action.laneIndex];
        if (!deployLane?.location) continue;
        const synergy = eraSynergyBonus(card, deployLane.location);
        const effectiveCost = Math.max(0, card.cost - ps.deployCostReduction);
        const score = card.attack + card.defense + synergy - effectiveCost * 0.1;
        if (score > bestScore) {
          bestScore = score;
          best = action;
        }
      }
      return best;
    }

    if (playLocations.length > 0 && !lane?.location) return playLocations[0]!;
    if (events.length > 0) return events[0]!;
    if (establish.length > 0) return establish[0]!;

    return { type: "end_phase" };
  }

  if (state.phase === "campaign") {
    const establishDone = playerState(state, "ai").hasEstablishedInfluenceThisTurn;
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
    void establishDone;
    return { type: "end_phase" };
  }

  return { type: "end_phase" };
}

export function buildAiDeckFromPoolLegacy(pool: CardSnapshot[], rules: BattleRules = DEFAULT_BATTLE_RULES): CardSnapshot[] {
  const result = buildDeck(pool, rules);
  return result.ok ? result.deck : [];
}
