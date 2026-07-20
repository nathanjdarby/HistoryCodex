import { DEFAULT_BATTLE_RULES } from "@/lib/battle/constants";
import {
  applyDamageToUnit,
  effectiveAttack,
  effectiveMaxDefense,
  currentDefenseFromDamage,
} from "@/lib/battle/abilities";
import type { BattleRules, BoardUnit, Lane, MatchState, PlayerId } from "@/lib/battle/types";
import { opponentOf, playerState, unitsInLane } from "@/lib/battle/types";

export type AttackPreview = {
  attackerAtk: number;
  defenderAtk: number;
  attackerRemaining: number;
  defenderRemaining: number;
  attackerDestroyed: boolean;
  defenderDestroyed: boolean;
  giantSlayerApplied: boolean;
  monarchAuraApplied: number;
  warriorMustTargetFirst: boolean;
};

export type EstablishInfluencePreview = {
  currentInfluence: number;
  resultingInfluence: number;
  willCapture: boolean;
  unitName: string;
};

export function previewAttack(
  state: MatchState,
  actor: PlayerId,
  laneIndex: number,
  attackerInstanceId: string,
  defenderInstanceId: string,
  rules: BattleRules = DEFAULT_BATTLE_RULES,
): AttackPreview | null {
  const lane = state.lanes[laneIndex];
  if (!lane?.location) return null;

  const attacker = unitsInLane(lane, actor).find((u) => u.instanceId === attackerInstanceId);
  const defender = unitsInLane(lane, opponentOf(actor)).find((u) => u.instanceId === defenderInstanceId);
  if (!attacker || !defender) return null;

  const monarchSuppressed = playerState(state, actor).monarchAuraSuppressed;
  const atkDamage = effectiveAttack(attacker, lane, rules, defender.rarity, monarchSuppressed);
  const defDamage = effectiveAttack(defender, lane, rules, attacker.rarity, monarchSuppressed);

  const attackerAfter = currentDefenseFromDamage(
    applyDamageToUnit(attacker, defDamage),
    lane.location,
  );
  const defenderAfter = currentDefenseFromDamage(
    applyDamageToUnit(defender, atkDamage),
    lane.location,
  );

  const monarchAuraApplied = Math.max(0, atkDamage - (attacker.baseAttack + attacker.tempAttackBonus));

  return {
    attackerAtk: atkDamage,
    defenderAtk: defDamage,
    attackerRemaining: attackerAfter,
    defenderRemaining: defenderAfter,
    attackerDestroyed: attackerAfter <= 0,
    defenderDestroyed: defenderAfter <= 0,
    giantSlayerApplied:
      attacker.archetype === "warrior" &&
      attacker.abilityEffect === "vs_higher_rarity_attack" &&
      ["epic", "legendary", "mythic"].includes(defender.rarity),
    monarchAuraApplied,
    warriorMustTargetFirst: unitsInLane(lane, opponentOf(actor)).some((u) => u.archetype === "warrior" && u.currentDefense > 0),
  };
}

export function previewEstablishInfluence(
  state: MatchState,
  actor: PlayerId,
  laneIndex: number,
  unitInstanceId: string,
  rules: BattleRules = DEFAULT_BATTLE_RULES,
): EstablishInfluencePreview | null {
  const lane = state.lanes[laneIndex];
  if (!lane?.location) return null;
  const unit = unitsInLane(lane, actor).find((u) => u.instanceId === unitInstanceId);
  if (!unit) return null;

  const current =
    actor === "player" ? lane.playerInfluence : lane.aiInfluence;
  const resulting = Math.min(current + 1, rules.influenceToCapture);

  return {
    currentInfluence: current,
    resultingInfluence: resulting,
    willCapture: resulting >= rules.influenceToCapture,
    unitName: unit.name,
  };
}

export function unitDisplayDef(unit: BoardUnit, location: import("@/lib/battle/types").CardSnapshot | null) {
  return {
    current: currentDefenseFromDamage(unit, location),
    max: effectiveMaxDefense(unit, location),
  };
}
