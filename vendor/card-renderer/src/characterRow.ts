import type { Archetype, CardDesignData, CardType, EraDesign, Rarity } from "./types";

/** Supabase `characters` row (snake_case columns). */
export type CharacterRow = Record<string, unknown>;

/** Era row subset used to populate card.era from characters.era_id. */
export interface EraSource {
  id: unknown;
  name: string;
  colorPrimary: string;
  colorSecondary: string;
}

export interface CharacterRowToCardOptions {
  /** Defaults to `#${id}` zero-padded to 3 digits. */
  dexLabel?: string;
  locked?: boolean;
}

/** Columns mapped explicitly — everything else on the row becomes card.extras. */
const CHARACTER_CARD_COLUMNS = new Set([
  "name",
  "rarity",
  "card_type",
  "cost",
  "attack",
  "defense",
  "archetype",
  "ability_name",
  "ability_effect",
  "ability_value",
  "ability_trigger",
  "flavor_text",
  "image_url",
  "image_focus_x",
  "image_focus_y",
  "image_scale",
  "holographic",
  "layout_id",
]);

const CHARACTER_ROW_METADATA = new Set(["id", "era_id", "seed", "created_at"]);

/** Collect registry-backed custom columns (house, speed, etc.) from a DB row. */
export function characterRowExtras(row: CharacterRow): Record<string, unknown> {
  const extras: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (CHARACTER_CARD_COLUMNS.has(key) || CHARACTER_ROW_METADATA.has(key)) continue;
    if (value !== undefined) extras[key] = value;
  }
  return extras;
}

function resolveEra(row: CharacterRow, eras: EraSource[]): EraDesign {
  const era = eras.find((e) => String(e.id) === String(row.era_id));
  return era
    ? { name: era.name, colorPrimary: era.colorPrimary, colorSecondary: era.colorSecondary }
    : { name: "", colorPrimary: "#3f3f46", colorSecondary: "#3f3f46" };
}

function defaultDexLabel(row: CharacterRow): string {
  if (row.id === null || row.id === undefined) return "#000";
  return `#${String(row.id).padStart(3, "0")}`;
}

/** Map a Supabase characters row (+ optional era list) to CardDesignData for CardRenderer. */
export function characterRowToCard(
  row: CharacterRow,
  eras: EraSource[] = [],
  options: CharacterRowToCardOptions = {}
): CardDesignData {
  return {
    name: String(row.name || ""),
    rarity: (row.rarity as Rarity) || "common",
    cardType: (row.card_type as CardType) || "character",
    cost: Number(row.cost) || 0,
    attack: Number(row.attack) || 0,
    defense: Number(row.defense) || 0,
    archetype: (row.archetype as Archetype) || null,
    era: resolveEra(row, eras),
    abilityName: (row.ability_name as string) || null,
    abilityEffect: (row.ability_effect as string) || null,
    abilityValue: row.ability_value === null || row.ability_value === undefined ? null : Number(row.ability_value),
    abilityTrigger: (row.ability_trigger as string) || null,
    flavorText: (row.flavor_text as string) || null,
    imageUrl: (row.image_url as string) || null,
    imageFrame: {
      focusX: Number(row.image_focus_x) || 50,
      focusY: Number(row.image_focus_y) || 50,
      scale: Number(row.image_scale) || 100,
    },
    holographic: Boolean(row.holographic),
    dexLabel: options.dexLabel ?? defaultDexLabel(row),
    locked: options.locked ?? false,
    layoutId: row.layout_id === null || row.layout_id === undefined ? null : String(row.layout_id),
    extras: characterRowExtras(row),
  };
}

/** Map CardDesignData back to a characters table update payload. */
export function characterCardToRow(card: CardDesignData, eraId: string | number): CharacterRow {
  return {
    name: card.name,
    era_id: Number(eraId),
    rarity: card.rarity,
    card_type: card.cardType,
    cost: card.cost,
    attack: card.attack,
    defense: card.defense,
    archetype: card.archetype,
    image_url: card.imageUrl,
    image_focus_x: card.imageFrame.focusX,
    image_focus_y: card.imageFrame.focusY,
    image_scale: card.imageFrame.scale,
    holographic: card.holographic,
    ability_name: card.abilityName,
    ability_effect: card.abilityEffect,
    ability_value: card.abilityValue,
    ability_trigger: card.abilityTrigger,
    flavor_text: card.flavorText,
    layout_id: card.layoutId ? Number(card.layoutId) : null,
    ...(card.extras || {}),
  };
}

/** @deprecated Use characterRowToCard */
export const mapCharacterToCard = characterRowToCard;

/** @deprecated Use characterCardToRow */
export const characterRowFromCard = characterCardToRow;
