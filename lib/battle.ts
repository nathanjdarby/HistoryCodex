import type { Archetype, Rarity } from "@/lib/sprite/generateSprite";
import type { AbilityEffect, AbilityTrigger } from "@/lib/battle/types";

export type { AbilityEffect, AbilityTrigger };

export const ABILITY_TRIGGER_LABELS: Record<AbilityTrigger, string> = {
  deploy: "On deploy",
  death: "On death",
  campaign_start: "Start of Campaign",
};

export const ABILITY_TRIGGER_OPTIONS: AbilityTrigger[] = [
  "deploy",
  "death",
  "campaign_start",
];

export const ABILITY_EFFECT_LABELS: Record<AbilityEffect, string> = {
  flat_attack: "Flat attack bonus",
  flat_defense: "Flat defense bonus",
  vs_higher_rarity_attack: "Bonus vs higher-rarity opponents",
  vs_lower_rarity_attack: "Bonus vs lower-rarity opponents",
  scry: "Scry top cards of deck",
  search_deck: "Search deck for a unit",
  discard_to_hand: "Return a card from discard to hand",
  discard_draw: "Discard a card to draw two",
  heal_unit: "Heal a friendly unit",
  add_influence: "Gain influence on location",
  remove_influence: "Remove enemy influence",
  cost_reduction: "Reduce next deploy cost",
  block_influence_gain: "Block enemy influence this turn",
  replace_location: "Replace the active location",
  draw_card: "Draw card(s)",
};

export const ABILITY_EFFECT_OPTIONS: AbilityEffect[] = [
  "flat_attack",
  "flat_defense",
  "vs_higher_rarity_attack",
  "vs_lower_rarity_attack",
  "scry",
  "search_deck",
  "discard_to_hand",
  "discard_draw",
  "heal_unit",
  "add_influence",
  "remove_influence",
  "cost_reduction",
  "block_influence_gain",
  "replace_location",
  "draw_card",
];

export function describeAbilityEffect(
  effect: AbilityEffect | null,
  value: number | null,
  eraName?: string,
): string | null {
  if (!effect || value == null) return null;
  switch (effect) {
    case "flat_attack":
      return `+${value} ATK`;
    case "flat_defense":
      return eraName ? `+${value} DEF to ${eraName} characters` : `+${value} DEF`;
    case "vs_higher_rarity_attack":
      return `+${value} damage vs higher-rarity targets`;
    case "vs_lower_rarity_attack":
      return `Gain ${value} CP`;
    case "scry":
      return `Scry ${value}`;
    case "search_deck":
      return `Search top ${value} cards`;
    case "discard_to_hand":
      return "Return 1 card from discard";
    case "discard_draw":
      return "Discard 1, draw 2";
    case "heal_unit":
      return `Heal ${value} DEF`;
    case "add_influence":
      return `+${value} influence`;
    case "remove_influence":
      return `-${value} enemy influence`;
    case "cost_reduction":
      return `Next deploy costs ${value} less CP`;
    case "block_influence_gain":
      return "Enemy cannot gain influence this turn";
    case "replace_location":
      return "Replace location from hand";
    case "draw_card":
      return `Draw ${value} card(s)`;
    default:
      return null;
  }
}

const STAT_POOL_BY_RARITY: Record<Rarity, number> = {
  common: 40,
  uncommon: 65,
  rare: 100,
  epic: 145,
  legendary: 200,
  mythic: 270,
};

const ATTACK_SPLIT_BY_ARCHETYPE: Record<Archetype | "none", number> = {
  warrior: 0.6,
  monarch: 0.5,
  leader: 0.52,
  sailor: 0.55,
  merchant: 0.45,
  scholar: 0.35,
  none: 0.5,
};

const ABILITY_BY_ARCHETYPE: Record<
  Archetype,
  { name: string; effect: AbilityEffect; fraction: number }
> = {
  warrior: { name: "Giant Slayer", effect: "vs_higher_rarity_attack", fraction: 0.15 },
  scholar: { name: "Fortified Study", effect: "flat_defense", fraction: 0.12 },
  monarch: { name: "Commanding Presence", effect: "flat_attack", fraction: 0.12 },
  merchant: { name: "Shrewd Bargain", effect: "vs_lower_rarity_attack", fraction: 0.15 },
  sailor: { name: "Sea Legs", effect: "flat_defense", fraction: 0.1 },
  leader: { name: "Rally the Host", effect: "flat_attack", fraction: 0.14 },
};

export type DefaultBattleStats = {
  attack: number;
  defense: number;
  abilityName: string | null;
  abilityEffect: AbilityEffect | null;
  abilityValue: number | null;
};

export function computeDefaultBattleStats(
  rarity: Rarity,
  archetype: Archetype | null,
): DefaultBattleStats {
  const pool = STAT_POOL_BY_RARITY[rarity];
  const attackFraction = ATTACK_SPLIT_BY_ARCHETYPE[archetype ?? "none"];
  const attack = Math.round(pool * attackFraction);
  const defense = pool - attack;
  const ability = archetype ? ABILITY_BY_ARCHETYPE[archetype] : null;

  return {
    attack,
    defense,
    abilityName: ability?.name ?? null,
    abilityEffect: ability?.effect ?? null,
    abilityValue: ability ? Math.round(pool * ability.fraction) : null,
  };
}

const LOCATION_BUFF_VALUE_BY_RARITY: Record<Rarity, number> = {
  common: 10,
  uncommon: 15,
  rare: 25,
  epic: 40,
  legendary: 60,
  mythic: 90,
};

export function computeDefaultLocationBuff(rarity: Rarity) {
  return {
    abilityName: "Home Ground Advantage",
    abilityEffect: "flat_defense" as const,
    abilityValue: LOCATION_BUFF_VALUE_BY_RARITY[rarity],
  };
}

export function describeLocationBuff(
  effect: AbilityEffect | null,
  value: number | null,
  eraName: string,
): string | null {
  if (!effect || value == null) return null;
  if (effect === "flat_defense") {
    return `+${value} DEF to ${eraName} characters`;
  }
  return describeAbilityEffect(effect, value, eraName);
}

export type CardAbilityInput = {
  cardType: string;
  abilityName?: string | null;
  abilityEffect?: AbilityEffect | null;
  abilityValue?: number | null;
  abilityTrigger?: AbilityTrigger | null;
  eraName?: string;
};

export function cardAbilityPanelLabel(cardType: string): string {
  return cardType === "location" ? "Buff" : "Ability";
}

export function hasCardAbility({
  abilityName,
  abilityEffect,
  abilityTrigger,
}: Pick<CardAbilityInput, "abilityName" | "abilityEffect" | "abilityTrigger">): boolean {
  return Boolean(abilityName?.trim() || abilityEffect || abilityTrigger);
}

export function describeCardAbility({
  cardType,
  abilityName,
  abilityEffect,
  abilityValue,
  abilityTrigger,
  eraName = "",
}: CardAbilityInput): string | null {
  const effectText =
    cardType === "location"
      ? describeLocationBuff(
          abilityEffect ?? null,
          abilityValue ?? null,
          eraName || "this era",
        )
      : describeAbilityEffect(abilityEffect ?? null, abilityValue ?? null, eraName);

  const triggerLabel =
    abilityTrigger && cardType !== "location"
      ? ABILITY_TRIGGER_LABELS[abilityTrigger]
      : null;

  if (effectText && triggerLabel) {
    return `${triggerLabel}: ${effectText}`;
  }
  if (effectText) return effectText;
  if (abilityName?.trim() && triggerLabel) {
    return `${triggerLabel}: ${abilityName.trim()}`;
  }
  if (abilityName?.trim()) return abilityName.trim();
  return triggerLabel;
}
