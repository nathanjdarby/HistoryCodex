export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";

export type CardType = "character" | "unit" | "location" | "event";

export type Archetype = "warrior" | "scholar" | "monarch" | "merchant" | "sailor" | "leader" | null;

export interface EraDesign {
  name: string;
  colorPrimary: string;
  colorSecondary: string;
}

export interface ImageFrame {
  focusX: number;
  focusY: number;
  scale: number;
}

export interface CardDesignData {
  name: string;
  rarity: Rarity;
  cardType: CardType;
  cost: number;
  attack: number;
  defense: number;
  archetype: Archetype;
  era: EraDesign;
  abilityName: string | null;
  abilityEffect: string | null;
  abilityValue: number | null;
  abilityTrigger: string | null;
  flavorText: string | null;
  imageUrl: string | null;
  imageFrame: ImageFrame;
  holographic: boolean;
  dexLabel: string;
  locked: boolean;
  /** Optional per-card layout override id (characters.layout_id). */
  layoutId?: string | null;
  /** Extra stat columns keyed by column name — populated from DB row extras. */
  extras?: Record<string, unknown>;
}

export function blankCard(): CardDesignData {
  return {
    name: "New Card",
    rarity: "common",
    cardType: "unit",
    cost: 0,
    attack: 0,
    defense: 0,
    archetype: null,
    era: { name: "", colorPrimary: "#b45309", colorSecondary: "#0e7490" },
    abilityName: null,
    abilityEffect: null,
    abilityValue: null,
    abilityTrigger: null,
    flavorText: null,
    imageUrl: null,
    imageFrame: { focusX: 50, focusY: 50, scale: 100 },
    holographic: false,
    dexLabel: "#000",
    locked: false,
    layoutId: null,
    extras: {},
  };
}
