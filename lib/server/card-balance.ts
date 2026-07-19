import {
  computeDefaultBattleStats,
  computeDefaultLocationBuff,
  type DefaultBattleStats,
} from "@/lib/battle";
import type { AbilityEffect, AbilityTrigger } from "@/lib/battle/types";
import type { Archetype, Rarity } from "@/lib/sprite/generateSprite";

export const COST_BY_RARITY: Record<Rarity, number> = {
  common: 20,
  uncommon: 40,
  rare: 75,
  epic: 150,
  legendary: 300,
  mythic: 450,
};

const STAT_POOL_BY_RARITY: Record<Rarity, number> = {
  common: 40,
  uncommon: 65,
  rare: 100,
  epic: 145,
  legendary: 200,
  mythic: 270,
};

const ARCHETYPE_ATTACK_RATIO: Record<Archetype | "none", number> = {
  warrior: 0.6,
  monarch: 0.5,
  leader: 0.52,
  sailor: 0.55,
  merchant: 0.45,
  scholar: 0.35,
  none: 0.5,
};

export type StatProfile =
  | "balanced"
  | "aggressive"
  | "offensive"
  | "defensive"
  | "fortress"
  | "skirmisher";

const PROFILE_ATTACK_RATIO: Record<StatProfile, number | null> = {
  balanced: null,
  aggressive: 0.62,
  offensive: 0.58,
  defensive: 0.38,
  fortress: 0.32,
  skirmisher: 0.66,
};

export type EventAbilityDef = {
  abilityName: string;
  abilityEffect: AbilityEffect;
  abilityValue: number;
};

export type CustomAbilityDef = EventAbilityDef & {
  abilityTrigger?: AbilityTrigger | null;
};

export type CardBalanceDef = {
  rarity: Rarity;
  flavorText: string;
  archetype?: Archetype | null;
  statProfile?: StatProfile;
  attackAdjust?: number;
  defenseAdjust?: number;
  eventAbility?: EventAbilityDef;
  customAbility?: CustomAbilityDef;
  locationAbility?: EventAbilityDef;
  locationBuffAdjust?: number;
};

function attackRatioFor(profile: StatProfile, archetype: Archetype | null): number {
  const profileRatio = PROFILE_ATTACK_RATIO[profile];
  if (profileRatio != null) return profileRatio;
  return ARCHETYPE_ATTACK_RATIO[archetype ?? "none"];
}

export function buildBalancedBattleStats(
  rarity: Rarity,
  archetype: Archetype | null,
  profile: StatProfile = "balanced",
  adjustments?: { attackAdjust?: number; defenseAdjust?: number },
): DefaultBattleStats {
  const pool = STAT_POOL_BY_RARITY[rarity];
  const ratio = attackRatioFor(profile, archetype);
  let attack = Math.round(pool * ratio);
  let defense = pool - attack;

  if (adjustments?.attackAdjust) attack += adjustments.attackAdjust;
  if (adjustments?.defenseAdjust) defense += adjustments.defenseAdjust;

  const abilities = computeDefaultBattleStats(rarity, archetype);
  return {
    attack: Math.max(1, attack),
    defense: Math.max(1, defense),
    abilityName: abilities.abilityName,
    abilityEffect: abilities.abilityEffect,
    abilityValue: abilities.abilityValue,
  };
}

export function buildLocationBalance(
  rarity: Rarity,
  buffAdjust = 0,
  override?: EventAbilityDef,
) {
  if (override) {
    return {
      abilityName: override.abilityName,
      abilityEffect: override.abilityEffect,
      abilityValue: Math.max(5, override.abilityValue + buffAdjust),
    };
  }

  const buff = computeDefaultLocationBuff(rarity);
  if (!buffAdjust) return buff;
  return {
    ...buff,
    abilityValue: Math.max(5, (buff.abilityValue ?? 0) + buffAdjust),
  };
}

export function buildEventBalance(rarity: Rarity, ability: EventAbilityDef) {
  return {
    rarity,
    cost: COST_BY_RARITY[rarity],
    archetype: null as Archetype | null,
    attack: 0,
    defense: 0,
    abilityTrigger: null,
    ...ability,
  };
}
