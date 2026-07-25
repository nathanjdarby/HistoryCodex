import { buildRegistry, type ElementRegistry } from "./registry";

/** Fallback registry when DB rows aren't loaded yet — mirrors 004_card_platform.sql seeds. */
export const BUILTIN_FIELD_ROWS = [
  { id: "name", label: "Name", column_name: "name", data_type: "text", sort_order: 10 },
  { id: "rarity", label: "Rarity", column_name: "rarity", data_type: "enum", sort_order: 20 },
  { id: "card_type", label: "Card type", column_name: "card_type", data_type: "enum", sort_order: 30 },
  { id: "cost", label: "Cost (PWR)", column_name: "cost", data_type: "number", sort_order: 40 },
  { id: "attack", label: "Attack", column_name: "attack", data_type: "number", sort_order: 50 },
  { id: "defense", label: "Defense", column_name: "defense", data_type: "number", sort_order: 60 },
  { id: "archetype", label: "Archetype", column_name: "archetype", data_type: "text", sort_order: 70 },
  { id: "ability_name", label: "Ability name", column_name: "ability_name", data_type: "text", sort_order: 80 },
  { id: "ability_effect", label: "Ability effect", column_name: "ability_effect", data_type: "enum", sort_order: 90 },
  { id: "ability_value", label: "Ability value", column_name: "ability_value", data_type: "number", sort_order: 100 },
  { id: "ability_trigger", label: "Ability trigger", column_name: "ability_trigger", data_type: "enum", sort_order: 110 },
  { id: "flavor_text", label: "Flavor text", column_name: "flavor_text", data_type: "text", sort_order: 120 },
  { id: "image_url", label: "Image URL", column_name: "image_url", data_type: "text", sort_order: 130 },
  { id: "holographic", label: "Holographic", column_name: "holographic", data_type: "boolean", sort_order: 140 },
  { id: "era_name", label: "Era name", column_name: "era_name", data_type: "computed", sort_order: 150 },
  { id: "dex_label", label: "Dex label", column_name: "dex_label", data_type: "computed", sort_order: 160 },
];

export const BUILTIN_ELEMENT_ROWS = [
  { id: "name", label: "Name", render_kind: "text", data_field_id: "name", config: { formatter: "name", slotClass: "cd-name-slot", textClass: "cd-el-name" } },
  { id: "rarityPill", label: "Rarity pill", render_kind: "rarity_pill", data_field_id: "rarity", config: {} },
  { id: "stars", label: "Stars", render_kind: "stars", data_field_id: "rarity", config: {} },
  { id: "artFrame", label: "Art frame", render_kind: "image", data_field_id: "image_url", config: {} },
  { id: "badgePwr", label: "PWR badge", render_kind: "stat_badge", data_field_id: "cost", config: { label: "PWR" }, visibility_rule: { op: "gt", field: "cost", value: 0 } },
  { id: "badgeArchetype", label: "Archetype badge", render_kind: "stat_badge", data_field_id: "archetype", config: { icon: "archetype", iconSize: "lg" }, visibility_rule: { op: "truthy", field: "archetype" } },
  { id: "badgeAtk", label: "Attack badge", render_kind: "stat_badge", data_field_id: "attack", config: { label: "ATK", icon: "swords", iconWithValue: true }, visibility_rule: { op: "neq", field: "cardType", value: "location" } },
  { id: "badgeDef", label: "Defense badge", render_kind: "stat_badge", data_field_id: "defense", config: { label: "DEF", icon: "shield", iconWithValue: true }, visibility_rule: { op: "neq", field: "cardType", value: "location" } },
  { id: "chipType", label: "Type chip", render_kind: "chip", data_field_id: "card_type", config: { variant: "type" } },
  { id: "chipAbility", label: "Ability chip", render_kind: "chip", data_field_id: "ability_name", config: { variant: "ability" }, visibility_rule: { op: "truthy", field: "abilityName" } },
  { id: "abilityLabel", label: "Ability label", render_kind: "text", data_field_id: null, config: { formatter: "ability_label", slotClass: "cd-ability-label-slot", textClass: "cd-ability-label" }, visibility_rule: { op: "has_ability_body" } },
  { id: "abilityBody", label: "Ability body", render_kind: "text", data_field_id: null, config: { formatter: "ability_body", slotClass: "cd-ability-body-slot", textClass: "cd-ability-body" }, visibility_rule: { op: "has_ability_body" } },
  { id: "eraName", label: "Era name", render_kind: "text", data_field_id: "era_name", config: { formatter: "era_name", slotClass: "cd-era-name-slot", textClass: "cd-era-name-text", wrapClass: "cd-era-box" } },
  { id: "eraDex", label: "Era footer dex", render_kind: "text", data_field_id: "dex_label", config: { formatter: "dex", slotClass: "cd-era-dex-slot", textClass: "cd-era-dex-text", wrapClass: "cd-era-box cd-era-box-end" } },
  { id: "flavorText", label: "Flavor text", render_kind: "text", data_field_id: "flavor_text", config: { formatter: "flavor", slotClass: "cd-flavor-text-slot", textClass: "cd-flavor-text", quote: true }, visibility_rule: { op: "truthy", field: "flavorText" } },
  { id: "cornerDex", label: "Corner dex", render_kind: "text", data_field_id: "dex_label", config: { formatter: "dex", slotClass: "cd-corner-dex-slot", textClass: "cd-corner-dex" } },
];

export const BUILTIN_REGISTRY: ElementRegistry = buildRegistry(BUILTIN_FIELD_ROWS, BUILTIN_ELEMENT_ROWS);
