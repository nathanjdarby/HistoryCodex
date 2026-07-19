import {
  ABILITY_EFFECT_LABELS,
  ABILITY_EFFECT_OPTIONS,
  ABILITY_TRIGGER_LABELS,
  ABILITY_TRIGGER_OPTIONS,
  describeAbilityEffect,
  describeCardAbility,
} from "@/lib/battle";
import type { AbilityEffect, AbilityTrigger, CardType } from "@/lib/battle/types";

export type AbilityCardContext = "event" | "unit" | "character" | "location";

export type AbilityEffectCatalogEntry = {
  id: AbilityEffect;
  label: string;
  summary: string;
  eventTemplate?: string;
  contexts: AbilityCardContext[];
  triggers: AbilityTrigger[];
  valueKind: "number" | "none";
  valueGuide: string;
  exampleRare: string;
  needsLane?: boolean;
  needsFriendlyTarget?: boolean;
  needsEnemyTarget?: boolean;
  interactive?: boolean;
};

export type AbilityTriggerCatalogEntry = {
  id: AbilityTrigger;
  label: string;
  summary: string;
  supportedEffects: AbilityEffect[];
};

export type ArchetypePassiveCatalogEntry = {
  id: string;
  archetype: string;
  name: string;
  summary: string;
  implementation: "hard-coded";
};

const EXAMPLE_RARE_VALUE = 25;

const ABILITY_EFFECT_DETAILS: Record<
  AbilityEffect,
  Omit<AbilityEffectCatalogEntry, "id" | "label" | "exampleRare">
> = {
  flat_attack: {
    summary: "Adds temporary attack to friendly units in a lane until end of turn.",
    eventTemplate: "Offensive Maneuver",
    contexts: ["event", "unit", "character"],
    triggers: ["deploy", "campaign_start"],
    valueKind: "number",
    valueGuide:
      "ATK bonus. On events/units: applied to the whole lane. Archetype defaults use ~12–15% of the rarity stat pool.",
    needsLane: true,
  },
  flat_defense: {
    summary: "Adds defense — lane-wide on events, era-scoped on locations.",
    eventTemplate: "Fortify Position",
    contexts: ["event", "unit", "character", "location"],
    triggers: ["deploy", "campaign_start"],
    valueKind: "number",
    valueGuide:
      "DEF bonus. Locations: +N DEF to units matching the location era. Default location buff scales by rarity (10–90).",
    needsLane: true,
  },
  vs_higher_rarity_attack: {
    summary: "Deals direct DEF damage to a higher-rarity enemy, or triggers Giant Slayer math on warriors.",
    eventTemplate: "Decisive Strike",
    contexts: ["event", "unit", "character"],
    triggers: ["death"],
    valueKind: "number",
    valueGuide:
      "Damage amount on events/death triggers. Warriors with this effect also double ATK vs Epic+ targets (separate passive).",
    needsLane: true,
    needsEnemyTarget: true,
  },
  vs_lower_rarity_attack: {
    summary: "Grants CP immediately — the Merchant archetype default.",
    eventTemplate: "Economic Surge",
    contexts: ["event", "unit", "character"],
    triggers: [],
    valueKind: "number",
    valueGuide: "CP gained. Merchant defaults use ~15% of the rarity stat pool.",
  },
  scry: {
    summary: "Look at the top N deck cards and reorder them.",
    eventTemplate: "Royal Survey",
    contexts: ["event"],
    triggers: [],
    valueKind: "number",
    valueGuide: "Number of cards to scry (typically 2–4). Pauses for player choice.",
    interactive: true,
  },
  search_deck: {
    summary: "Reveal top N cards; pick one unit/character for hand; shuffle the rest.",
    eventTemplate: "Archive Search",
    contexts: ["event"],
    triggers: [],
    valueKind: "number",
    valueGuide: "Reveal depth (typically 3–6). Pauses for player choice.",
    interactive: true,
  },
  discard_to_hand: {
    summary: "Return one card from discard pile to hand.",
    eventTemplate: "Historical Revision",
    contexts: ["event"],
    triggers: [],
    valueKind: "none",
    valueGuide: "Value is ignored. Pauses for discard selection.",
    interactive: true,
  },
  discard_draw: {
    summary: "Discard one hand card, then draw two.",
    eventTemplate: "Mobilize Reserves",
    contexts: ["event"],
    triggers: [],
    valueKind: "none",
    valueGuide: "Value is ignored. Pauses for discard selection.",
    interactive: true,
  },
  heal_unit: {
    summary: "Restore DEF to one friendly unit in a lane.",
    eventTemplate: "Field Surgeon",
    contexts: ["event"],
    triggers: [],
    valueKind: "number",
    valueGuide: "DEF restored (typically 10–40 by rarity). Requires friendly target.",
    needsLane: true,
    needsFriendlyTarget: true,
  },
  add_influence: {
    summary: "Gain influence tokens on a lane.",
    eventTemplate: "Proclamation",
    contexts: ["event", "unit", "character"],
    triggers: ["deploy"],
    valueKind: "number",
    valueGuide: "Influence gained (typically 1–3). Lane must have a location for deploy triggers.",
    needsLane: true,
  },
  remove_influence: {
    summary: "Strip enemy influence from a lane.",
    eventTemplate: "Undermine Authority",
    contexts: ["event"],
    triggers: [],
    valueKind: "number",
    valueGuide: "Enemy influence removed (typically 1–3).",
    needsLane: true,
  },
  cost_reduction: {
    summary: "Next deploy this turn costs less CP.",
    eventTemplate: "War Bonds",
    contexts: ["event"],
    triggers: [],
    valueKind: "number",
    valueGuide: "CP discount (typically 20–75).",
  },
  block_influence_gain: {
    summary: "Opponent cannot gain Consolidation influence this turn.",
    eventTemplate: "Protracted Siege",
    contexts: ["event"],
    triggers: [],
    valueKind: "none",
    valueGuide: "Value is ignored — binary effect for the turn.",
  },
  replace_location: {
    summary: "Swap the active lane location with one from hand for free; resets influence.",
    eventTemplate: "Relocate Capital",
    contexts: ["event"],
    triggers: [],
    valueKind: "none",
    valueGuide: "Value is ignored. Requires a location in hand.",
    needsLane: true,
  },
  draw_card: {
    summary: "Draw cards from deck.",
    eventTemplate: "Reinforcements",
    contexts: ["event", "unit", "character"],
    triggers: ["deploy", "death"],
    valueKind: "number",
    valueGuide: "Cards drawn (typically 1–2).",
  },
};

export const ABILITY_EFFECT_CATALOG: AbilityEffectCatalogEntry[] = ABILITY_EFFECT_OPTIONS.map(
  (id) => {
    const base = ABILITY_EFFECT_DETAILS[id];

    return {
      id,
      label: ABILITY_EFFECT_LABELS[id],
      exampleRare:
        describeAbilityEffect(id, EXAMPLE_RARE_VALUE, "this era") ??
        describeCardAbility({
          cardType: base.contexts.includes("location") ? "location" : "event",
          abilityEffect: id,
          abilityValue: EXAMPLE_RARE_VALUE,
          eraName: "this era",
        }) ??
        "—",
      ...base,
    };
  },
);

export const ABILITY_TRIGGER_CATALOG: AbilityTriggerCatalogEntry[] = ABILITY_TRIGGER_OPTIONS.map(
  (id) => {
    const supportedEffects = ABILITY_EFFECT_CATALOG.filter((entry) =>
      entry.triggers.includes(id),
    ).map((entry) => entry.id);

    const summaries: Record<AbilityTrigger, string> = {
      deploy: "Fires when the unit enters a lane during Logistics.",
      death: "Fires when the unit is destroyed during Campaign combat.",
      campaign_start: "Fires at the start of your Campaign phase each turn.",
    };

    return {
      id,
      label: ABILITY_TRIGGER_LABELS[id],
      summary: summaries[id],
      supportedEffects,
    };
  },
);

export const ARCHETYPE_PASSIVE_CATALOG: ArchetypePassiveCatalogEntry[] = [
  {
    id: "warrior-giant-slayer",
    archetype: "Warrior",
    name: "Giant Slayer + must-target-first",
    summary: "Must be attacked first in-lane. Doubles ATK vs Epic/Legendary/Mythic when abilityEffect is vs_higher_rarity_attack.",
    implementation: "hard-coded",
  },
  {
    id: "monarch-commanding",
    archetype: "Monarch",
    name: "Commanding Presence",
    summary: "+10 ATK aura to other friendly units in the same lane.",
    implementation: "hard-coded",
  },
  {
    id: "merchant-refund",
    archetype: "Merchant",
    name: "Shrewd Bargain",
    summary: "+20 CP refund immediately on deploy (tunable in Admin → Rules).",
    implementation: "hard-coded",
  },
  {
    id: "scholar-draw",
    archetype: "Scholar",
    name: "Fortified Study",
    summary: "+1 card drawn during Chronos while a Scholar is on the board.",
    implementation: "hard-coded",
  },
  {
    id: "sailor-sea-legs",
    archetype: "Sailor",
    name: "Sea Legs",
    summary: "+5 DEF when location era differs, +10 when eras match.",
    implementation: "hard-coded",
  },
  {
    id: "leader-rally",
    archetype: "Leader",
    name: "Rally the Host",
    summary: "+1 extra influence when lane is uncontested at Consolidation.",
    implementation: "hard-coded",
  },
];

export const ABILITY_VALUE_MATH = {
  statPoolByRarity: {
    common: 40,
    uncommon: 65,
    rare: 100,
    epic: 145,
    legendary: 200,
    mythic: 270,
  },
  locationBuffByRarity: {
    common: 10,
    uncommon: 15,
    rare: 25,
    epic: 40,
    legendary: 60,
    mythic: 90,
  },
  archetypeAbilityFraction: {
    warrior: 0.15,
    scholar: 0.12,
    monarch: 0.12,
    merchant: 0.15,
    sailor: 0.1,
    leader: 0.14,
  },
  formula:
    "Default unit abilityValue ≈ round(statPool[rarity] × archetypeFraction). Location buffs use fixed rarity table. Events set abilityValue explicitly in card balance data.",
};

export function contextsForCardType(cardType: CardType): AbilityCardContext[] {
  if (cardType === "event") return ["event"];
  if (cardType === "location") return ["location"];
  if (cardType === "unit") return ["unit", "character"];
  return ["character", "unit"];
}

export function effectsForCardType(cardType: CardType): AbilityEffectCatalogEntry[] {
  const contexts = contextsForCardType(cardType);
  return ABILITY_EFFECT_CATALOG.filter((entry) =>
    entry.contexts.some((context) => contexts.includes(context)),
  );
}
