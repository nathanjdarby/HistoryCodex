import { DEFAULT_BATTLE_RULES } from "@/lib/battle/constants";
import {
  applyDamageToUnit,
  effectiveAttack,
  syncUnitCurrentDefense,
} from "@/lib/battle/abilities";
import { appendLog } from "@/lib/battle/rng";
import { updateUnitInLane } from "@/lib/battle/phases/logistics";
import { runDeathTriggers } from "@/lib/battle/triggers";
import { canAttackTarget } from "@/lib/battle/validators";
import { removeDeadUnitsFromLane } from "@/lib/battle/unit-lifecycle";
import { runConsolidationInfluence } from "@/lib/battle/influence";
import type { BattleRules, MatchState, PlayerId } from "@/lib/battle/types";
import { opponentOf, playerState, unitsInLane } from "@/lib/battle/types";

export function resolveAttack(
  state: MatchState,
  actor: PlayerId,
  laneIndex: number,
  attackerInstanceId: string,
  defenderInstanceId: string,
  rules: BattleRules = DEFAULT_BATTLE_RULES,
): MatchState | null {
  const lane = state.lanes[laneIndex];
  if (!lane || !lane.location) return null;
  if (lane.attacksBlocked || playerState(state, actor).attacksBlockedThisTurn) return null;

  const attackers = unitsInLane(lane, actor);
  const defenders = unitsInLane(lane, opponentOf(actor));
  const attacker = attackers.find((u) => u.instanceId === attackerInstanceId);
  const defender = defenders.find((u) => u.instanceId === defenderInstanceId);
  if (!attacker || !defender) return null;
  if (
    attacker.summoningSickness ||
    attacker.cannotAttack ||
    attacker.isCommitted ||
    attacker.currentDefense <= 0 ||
    defender.currentDefense <= 0
  ) {
    return null;
  }

  if (!canAttackTarget(state, actor, laneIndex, attackerInstanceId, defenderInstanceId, rules)) {
    return null;
  }

  const monarchSuppressed = playerState(state, actor).monarchAuraSuppressed;
  const atkDamage = effectiveAttack(attacker, lane, rules, defender.rarity, monarchSuppressed);
  const defDamage = effectiveAttack(defender, lane, rules, attacker.rarity, monarchSuppressed);

  let lanes = updateUnitInLane(state.lanes, laneIndex, attacker.instanceId, (u) =>
    syncUnitCurrentDefense(applyDamageToUnit(u, defDamage), lane.location),
  );
  lanes = updateUnitInLane(lanes, laneIndex, defender.instanceId, (u) =>
    syncUnitCurrentDefense(applyDamageToUnit(u, atkDamage), lane.location),
  );

  let next = { ...state, lanes };
  next = appendLog(
    next,
    "attack_declared",
    `${attacker.name} (${atkDamage} ATK) clashes with ${defender.name} (${defDamage} ATK).`,
  );
  next = appendLog(next, "damage_dealt", `${defender.name} takes ${atkDamage}, ${attacker.name} takes ${defDamage}.`);

  next = removeDeadUnitsFromLane(next, laneIndex);
  return next;
}

export function runConsolidation(
  state: MatchState,
  rules: BattleRules = DEFAULT_BATTLE_RULES,
): MatchState {
  return runConsolidationInfluence(state, rules);
}
