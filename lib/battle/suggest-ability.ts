import {
  ABILITY_EFFECT_LABELS,
  computeDefaultBattleStats,
  computeDefaultLocationBuff,
} from "@/lib/battle";
import {
  ABILITY_EFFECT_CATALOG,
  ABILITY_VALUE_MATH,
  effectsForCardType,
} from "@/lib/battle/ability-catalog";
import type { AbilityEffect, AbilityTrigger, CardType } from "@/lib/battle/types";
import type { Archetype, Rarity } from "@/lib/sprite/generateSprite";

export type SuggestedAbilityFields = {
  abilityName: string;
  abilityEffect: AbilityEffect;
  abilityValue: number | null;
  abilityTrigger: AbilityTrigger | null;
  valueNote: string;
};

const TRIGGER_PRIORITY: AbilityTrigger[] = ["deploy", "campaign_start", "death"];

const EVENT_VALUE_BY_RARITY: Partial<
  Record<AbilityEffect, Partial<Record<Rarity, number>>>
> = {
  scry: { common: 2, uncommon: 3, rare: 3, epic: 4, legendary: 4, mythic: 5 },
  search_deck: { common: 3, uncommon: 4, rare: 5, epic: 6, legendary: 7, mythic: 8 },
  draw_card: { common: 1, uncommon: 1, rare: 2, epic: 2, legendary: 2, mythic: 2 },
  add_influence: { common: 1, uncommon: 1, rare: 1, epic: 2, legendary: 2, mythic: 2 },
  remove_influence: { common: 1, uncommon: 1, rare: 1, epic: 1, legendary: 2, mythic: 2 },
  cost_reduction: { common: 10, uncommon: 15, rare: 25, epic: 40, legendary: 60, mythic: 75 },
};

const EFFECTS_WITHOUT_VALUE: AbilityEffect[] = [
  "discard_to_hand",
  "discard_draw",
  "block_influence_gain",
  "replace_location",
];

export function isEffectValidForCardType(effect: AbilityEffect, cardType: CardType): boolean {
  return effectsForCardType(cardType).some((entry) => entry.id === effect);
}

export function validEffectsForCardType(cardType: CardType) {
  return effectsForCardType(cardType);
}

export function validTriggersForEffect(
  effect: AbilityEffect,
  cardType: CardType,
): AbilityTrigger[] {
  if (cardType === "event" || cardType === "location") return [];
  const entry = ABILITY_EFFECT_CATALOG.find((item) => item.id === effect);
  return entry?.triggers ?? [];
}

export function defaultTriggerForEffect(
  effect: AbilityEffect,
  cardType: CardType,
): AbilityTrigger | null {
  const triggers = validTriggersForEffect(effect, cardType);
  if (triggers.length === 0) return null;
  return TRIGGER_PRIORITY.find((trigger) => triggers.includes(trigger)) ?? triggers[0] ?? null;
}

function statPool(rarity: Rarity): number {
  return ABILITY_VALUE_MATH.statPoolByRarity[rarity];
}

function scaleFromPool(rarity: Rarity, fraction: number): number {
  return Math.max(1, Math.round(statPool(rarity) * fraction));
}

export function suggestAbilityName(
  effect: AbilityEffect,
  cardType: CardType,
  archetype: Archetype | null,
): string {
  if (cardType === "location" && effect === "flat_defense") {
    return computeDefaultLocationBuff("common").abilityName ?? "Home Ground Advantage";
  }

  const archetypeDefaults = computeDefaultBattleStats("rare", archetype);
  if (
    archetype &&
    (cardType === "unit" || cardType === "character") &&
    archetypeDefaults.abilityEffect === effect &&
    archetypeDefaults.abilityName
  ) {
    return archetypeDefaults.abilityName;
  }

  const catalogEntry = ABILITY_EFFECT_CATALOG.find((entry) => entry.id === effect);
  return catalogEntry?.eventTemplate ?? ABILITY_EFFECT_LABELS[effect];
}

export function suggestAbilityValue(
  effect: AbilityEffect,
  rarity: Rarity,
  cardType: CardType,
  archetype: Archetype | null,
): { value: number | null; note: string } {
  if (EFFECTS_WITHOUT_VALUE.includes(effect)) {
    return { value: null, note: "This effect ignores abilityValue in battle." };
  }

  if (cardType === "location") {
    if (effect === "flat_defense") {
      const buff = computeDefaultLocationBuff(rarity);
      return {
        value: buff.abilityValue,
        note: `Default ${rarity} location buff (+${buff.abilityValue} DEF).`,
      };
    }
    return {
      value: scaleFromPool(rarity, 0.12),
      note: `Lane-wide buff scaled from the ${rarity} stat pool.`,
    };
  }

  if (cardType === "event") {
    const tableValue = EVENT_VALUE_BY_RARITY[effect]?.[rarity];
    if (tableValue != null) {
      return { value: tableValue, note: `Typical ${rarity} event strength for ${effect}.` };
    }

    if (effect === "flat_attack" || effect === "flat_defense") {
      const fraction = effect === "flat_attack" ? 0.15 : 0.12;
      const value = scaleFromPool(rarity, fraction);
      return { value, note: `${Math.round(fraction * 100)}% of the ${rarity} stat pool.` };
    }

    if (effect === "vs_higher_rarity_attack") {
      const value = scaleFromPool(rarity, 0.12);
      return { value, note: `Direct damage ~12% of the ${rarity} stat pool.` };
    }

    if (effect === "vs_lower_rarity_attack") {
      const value = scaleFromPool(rarity, 0.15);
      return { value, note: `CP gain ~15% of the ${rarity} stat pool.` };
    }

    if (effect === "heal_unit") {
      const value = scaleFromPool(rarity, 0.15);
      return { value, note: `Heal ~15% of the ${rarity} stat pool.` };
    }
  }

  const defaults = computeDefaultBattleStats(rarity, archetype);
  if (
    (cardType === "unit" || cardType === "character") &&
    defaults.abilityEffect === effect &&
    defaults.abilityValue != null
  ) {
    const fraction =
      ABILITY_VALUE_MATH.archetypeAbilityFraction[archetype ?? "warrior"] ??
      ABILITY_VALUE_MATH.archetypeAbilityFraction.warrior;
    return {
      value: defaults.abilityValue,
      note: archetype
        ? `${archetype} default: round(${statPool(rarity)} × ${Math.round(fraction * 100)}%).`
        : `Suggested from the ${rarity} stat pool.`,
    };
  }

  if (effect === "draw_card") {
    return {
      value: rarity === "common" || rarity === "uncommon" ? 1 : 2,
      note: "Common draw counts for triggered units.",
    };
  }

  if (effect === "add_influence") {
    return {
      value: rarity === "epic" || rarity === "legendary" || rarity === "mythic" ? 2 : 1,
      note: "Influence tokens gained on deploy.",
    };
  }

  if (effect === "flat_attack" || effect === "flat_defense") {
    const fraction = effect === "flat_attack" ? 0.14 : 0.12;
    return {
      value: scaleFromPool(rarity, fraction),
      note: `Lane temp buff ~${Math.round(fraction * 100)}% of stat pool.`,
    };
  }

  if (effect === "vs_higher_rarity_attack") {
    return {
      value: scaleFromPool(rarity, 0.1),
      note: "Death-trigger damage or warrior-style scaling.",
    };
  }

  return {
    value: scaleFromPool(rarity, 0.12),
    note: `Fallback: ~12% of the ${rarity} stat pool.`,
  };
}

export function suggestAbilityFields(params: {
  effect: AbilityEffect;
  rarity: Rarity;
  cardType: CardType;
  archetype: Archetype | null;
}): SuggestedAbilityFields {
  const { effect, rarity, cardType, archetype } = params;
  const { value, note } = suggestAbilityValue(effect, rarity, cardType, archetype);

  return {
    abilityName: suggestAbilityName(effect, cardType, archetype),
    abilityEffect: effect,
    abilityValue: value,
    abilityTrigger: defaultTriggerForEffect(effect, cardType),
    valueNote: note,
  };
}

export function suggestArchetypeAbilityFields(
  rarity: Rarity,
  archetype: Archetype | null,
): SuggestedAbilityFields | null {
  if (!archetype) return null;
  const stats = computeDefaultBattleStats(rarity, archetype);
  if (!stats.abilityEffect) return null;

  const { note } = suggestAbilityValue(stats.abilityEffect, rarity, "unit", archetype);
  return {
    abilityName: stats.abilityName ?? suggestAbilityName(stats.abilityEffect, "unit", archetype),
    abilityEffect: stats.abilityEffect,
    abilityValue: stats.abilityValue,
    abilityTrigger: null,
    valueNote: note,
  };
}

export function suggestLocationBuffFields(rarity: Rarity): SuggestedAbilityFields {
  const buff = computeDefaultLocationBuff(rarity);
  const { note } = suggestAbilityValue(buff.abilityEffect, rarity, "location", null);
  return {
    abilityName: buff.abilityName ?? "Home Ground Advantage",
    abilityEffect: buff.abilityEffect,
    abilityValue: buff.abilityValue,
    abilityTrigger: null,
    valueNote: note,
  };
}
