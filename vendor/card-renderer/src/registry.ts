import { formatAbilityBody } from "./abilityFormat";
import type { CardDesignData, CardType } from "./types";
import type { RenderKind } from "./layout";

export interface CardDataField {
  id: string;
  label: string;
  columnName: string;
  dataType: "number" | "text" | "boolean" | "enum" | "computed";
  enumOptions: string[] | null;
  appliesToCardTypes: CardType[] | null;
  sortOrder: number;
}

export interface VisibilityRule {
  op: "gt" | "neq" | "truthy" | "has_ability_body" | "always";
  field?: string;
  value?: unknown;
}

export interface ElementTypeConfig {
  label?: string;
  icon?: string;
  iconSize?: string;
  iconWithValue?: boolean;
  valueFormat?: string;
  variant?: string;
  formatter?: string;
  slotClass?: string;
  textClass?: string;
  wrapClass?: string;
  quote?: boolean;
  slotStyle?: Record<string, string | number>;
  textStyle?: Record<string, string | number>;
  wrapStyle?: Record<string, string | number>;
  badgeStyle?: Record<string, string | number>;
  chipStyle?: Record<string, string | number>;
  [key: string]: unknown;
}

export interface ElementType {
  id: string;
  label: string;
  renderKind: RenderKind;
  dataFieldId: string | null;
  config: ElementTypeConfig;
  visibilityRule: VisibilityRule | null;
  appliesToCardTypes: CardType[] | null;
  introducedInVersion: number;
  deprecated: boolean;
}

export interface ElementRegistry {
  fields: CardDataField[];
  elements: ElementType[];
  fieldsById: Map<string, CardDataField>;
  elementsById: Map<string, ElementType>;
}

export interface RegistryRow {
  id: unknown;
  label?: unknown;
  column_name?: unknown;
  data_type?: unknown;
  enum_options?: unknown;
  applies_to_card_types?: unknown;
  sort_order?: unknown;
  render_kind?: unknown;
  data_field_id?: unknown;
  config?: unknown;
  visibility_rule?: unknown;
  introduced_in_version?: unknown;
  deprecated?: unknown;
}

function parseCardTypes(raw: unknown): CardType[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  return raw.map(String) as CardType[];
}

export function parseDataFieldRow(row: RegistryRow): CardDataField {
  return {
    id: String(row.id),
    label: String(row.label || row.id),
    columnName: String(row.column_name || row.id),
    dataType: (row.data_type as CardDataField["dataType"]) || "text",
    enumOptions: Array.isArray(row.enum_options) ? row.enum_options.map(String) : null,
    appliesToCardTypes: parseCardTypes(row.applies_to_card_types),
    sortOrder: Number(row.sort_order) || 0,
  };
}

export function parseElementTypeRow(row: RegistryRow): ElementType {
  return {
    id: String(row.id),
    label: String(row.label || row.id),
    renderKind: String(row.render_kind || "text") as RenderKind,
    dataFieldId: row.data_field_id ? String(row.data_field_id) : null,
    config: (row.config as ElementTypeConfig) || {},
    visibilityRule: (row.visibility_rule as VisibilityRule) || null,
    appliesToCardTypes: parseCardTypes(row.applies_to_card_types),
    introducedInVersion: Number(row.introduced_in_version) || 1,
    deprecated: Boolean(row.deprecated),
  };
}

export function buildRegistry(fieldRows: RegistryRow[], elementRows: RegistryRow[]): ElementRegistry {
  const fields = fieldRows.map(parseDataFieldRow).sort((a, b) => a.sortOrder - b.sortOrder);
  const elements = elementRows.map(parseElementTypeRow);
  return {
    fields,
    elements,
    fieldsById: new Map(fields.map((f) => [f.id, f])),
    elementsById: new Map(elements.map((e) => [e.id, e])),
  };
}

export function getCardFieldValue(card: CardDesignData, fieldId: string | null, registry: ElementRegistry): unknown {
  if (!fieldId) return null;
  const field = registry.fieldsById.get(fieldId);
  if (!field) return null;

  if (field.id === "era_name") return card.era.name;
  if (field.id === "dex_label") return card.dexLabel;

  const column = field.columnName;
  const cardRecord = card as unknown as Record<string, unknown>;
  const camelMap: Record<string, keyof CardDesignData> = {
    name: "name",
    rarity: "rarity",
    card_type: "cardType",
    cost: "cost",
    attack: "attack",
    defense: "defense",
    archetype: "archetype",
    ability_name: "abilityName",
    ability_effect: "abilityEffect",
    ability_value: "abilityValue",
    ability_trigger: "abilityTrigger",
    flavor_text: "flavorText",
    image_url: "imageUrl",
    holographic: "holographic",
  };

  const key = camelMap[column];
  if (key) return cardRecord[key];

  if (card.extras && column in card.extras) return card.extras[column];
  return null;
}

function resolveRuleField(card: CardDesignData, field: string): unknown {
  const map: Record<string, unknown> = {
    cost: card.cost,
    attack: card.attack,
    defense: card.defense,
    archetype: card.archetype,
    cardType: card.cardType,
    abilityName: card.abilityName,
    flavorText: card.flavorText,
    abilityEffect: card.abilityEffect,
  };
  if (field in map) return map[field];
  if (card.extras && field in card.extras) return card.extras[field];
  const cardRecord = card as unknown as Record<string, unknown>;
  if (field in cardRecord) return cardRecord[field];
  return undefined;
}

export function evaluateVisibilityRule(rule: VisibilityRule | null, card: CardDesignData, layoutMode: boolean): boolean {
  if (layoutMode) return true;
  if (!rule || rule.op === "always") return true;

  switch (rule.op) {
    case "gt": {
      const v = resolveRuleField(card, rule.field || "");
      return typeof v === "number" && v > Number(rule.value);
    }
    case "neq":
      return resolveRuleField(card, rule.field || "") !== rule.value;
    case "truthy": {
      const v = resolveRuleField(card, rule.field || "");
      return v !== null && v !== undefined && v !== "" && v !== false;
    }
    case "has_ability_body":
      return Boolean(formatAbilityBody(card.abilityEffect, card.abilityValue, card.abilityTrigger));
    default:
      return true;
  }
}

export function elementAppliesToCard(element: ElementType, cardType: CardType): boolean {
  if (!element.appliesToCardTypes || element.appliesToCardTypes.length === 0) return true;
  return element.appliesToCardTypes.includes(cardType);
}

export function isRenderKindSupported(
  renderKind: RenderKind,
  supportedKinds: readonly string[] | null | undefined
): boolean {
  if (!supportedKinds || supportedKinds.length === 0) return true;
  return supportedKinds.includes(renderKind);
}
