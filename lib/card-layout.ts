import type { CSSProperties } from "react";
import type { RegistryRow } from "@history-codex/card-renderer/registry";
import type { CardType } from "@/lib/battle/types";

export const LAYOUT_ELEMENT_IDS = [
  "name",
  "rarityPill",
  "stars",
  "artFrame",
  "badgePwr",
  "badgeArchetype",
  "badgeAtk",
  "badgeDef",
  "chipType",
  "chipAbility",
  "abilityLabel",
  "abilityBody",
  "eraName",
  "eraDex",
  "flavorText",
  "cornerDex",
] as const;

export type LayoutElementId = (typeof LAYOUT_ELEMENT_IDS)[number];

export interface LayoutBox {
  x: number;
  y: number;
  w: number;
  h: number;
  visible: boolean;
  z: number;
}

export type CardLayout = Record<LayoutElementId, LayoutBox>;

/** Matches the seeded "Default" layout in Supabase — used when DB fetch fails. */
export const DEFAULT_CARD_LAYOUT: CardLayout = {
  name: { x: 5, y: 3, w: 60, h: 7, visible: true, z: 0 },
  rarityPill: { x: 67, y: 3, w: 28, h: 4, visible: true, z: 1 },
  stars: { x: 67, y: 7.5, w: 22, h: 3, visible: true, z: 2 },
  artFrame: { x: 5, y: 11, w: 90, h: 50, visible: true, z: 3 },
  badgePwr: { x: 78, y: 13, w: 13, h: 9, visible: true, z: 4 },
  badgeArchetype: { x: 78, y: 23, w: 13, h: 9, visible: true, z: 5 },
  badgeAtk: { x: 78, y: 33, w: 13, h: 9, visible: true, z: 6 },
  badgeDef: { x: 78, y: 43, w: 13, h: 9, visible: true, z: 7 },
  chipType: { x: 5, y: 63, w: 22, h: 5, visible: true, z: 8 },
  chipAbility: { x: 29, y: 63, w: 35, h: 5, visible: true, z: 9 },
  abilityLabel: { x: 5, y: 70, w: 18, h: 7, visible: true, z: 10 },
  abilityBody: { x: 23, y: 70, w: 72, h: 7, visible: true, z: 11 },
  eraName: { x: 8, y: 79, w: 55, h: 4, visible: true, z: 12 },
  eraDex: { x: 80, y: 79, w: 15, h: 4, visible: true, z: 13 },
  flavorText: { x: 7, y: 84, w: 86, h: 12, visible: true, z: 14 },
  cornerDex: { x: 80, y: 94, w: 16, h: 4, visible: true, z: 15 },
};

function isLayoutBox(value: unknown): value is LayoutBox {
  if (!value || typeof value !== "object") return false;
  const box = value as Record<string, unknown>;
  return (
    typeof box.x === "number" &&
    typeof box.y === "number" &&
    typeof box.w === "number" &&
    typeof box.h === "number" &&
    typeof box.visible === "boolean" &&
    typeof box.z === "number"
  );
}

export function parseCardLayout(value: unknown): CardLayout | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  for (const id of LAYOUT_ELEMENT_IDS) {
    if (!isLayoutBox(record[id])) return null;
  }
  return record as CardLayout;
}

export function layoutBoxStyle(box: LayoutBox): CSSProperties {
  return {
    left: `${box.x}%`,
    top: `${box.y}%`,
    width: `${box.w}%`,
    height: `${box.h}%`,
    zIndex: box.z,
  };
}

export type CardLayoutsByType = Record<CardType, CardLayout>;

export interface CardLayoutSettings {
  aspectRatioW: number;
  aspectRatioH: number;
}

export const DEFAULT_CARD_LAYOUT_SETTINGS: CardLayoutSettings = {
  aspectRatioW: 5,
  aspectRatioH: 7,
};

export const CARD_ASPECT_RATIO_CSS_VARS = {
  w: "--card-aspect-ratio-w",
  h: "--card-aspect-ratio-h",
} as const;

export type CardLayoutBundle = {
  layouts: CardLayoutsByType;
  settings: CardLayoutSettings;
};

export type LayoutPresetRef = {
  id: string;
  name: string;
  layout: unknown;
};

export type LayoutAssignmentsByType = Record<CardType, string | null>;

export type CardPlatformBundle = CardLayoutBundle & {
  presets: LayoutPresetRef[];
  assignments: LayoutAssignmentsByType;
  registry: {
    fields: RegistryRow[];
    elements: RegistryRow[];
  };
  supportedRenderKinds: string[];
  packageVersion: string;
};

export function defaultCardLayoutsByType(): CardLayoutsByType {
  return {
    character: DEFAULT_CARD_LAYOUT,
    unit: DEFAULT_CARD_LAYOUT,
    location: DEFAULT_CARD_LAYOUT,
    event: DEFAULT_CARD_LAYOUT,
  };
}

export function defaultCardLayoutBundle(): CardLayoutBundle {
  return {
    layouts: defaultCardLayoutsByType(),
    settings: DEFAULT_CARD_LAYOUT_SETTINGS,
  };
}

export function cardAspectRatioStyle(settings: CardLayoutSettings): CSSProperties {
  return {
    aspectRatio: `${settings.aspectRatioW} / ${settings.aspectRatioH}`,
  };
}

function isCardLayoutSettings(value: unknown): value is CardLayoutSettings {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.aspectRatioW === "number" && typeof record.aspectRatioH === "number";
}

export function parseCardLayoutSettings(value: unknown): CardLayoutSettings | null {
  if (!isCardLayoutSettings(value)) return null;
  if (value.aspectRatioW <= 0 || value.aspectRatioH <= 0) return null;
  return value;
}

/** Adaptive card-name font classes (cqw-based, for use inside .card-container). */
const ADAPTIVE_CARD_NAME_SIZES: readonly { max: number; className: string }[] = [
  { max: 28, className: "card-text-name-xl" },
  { max: 42, className: "card-text-name-lg" },
  { max: 58, className: "card-text-name-md" },
  { max: 72, className: "card-text-name-sm" },
  { max: Infinity, className: "card-text-name-xs" },
];

export function adaptiveCardNameClass(name: string): string {
  const length = name.trim().length;
  return (
    ADAPTIVE_CARD_NAME_SIZES.find((tier) => length <= tier.max)?.className ??
    ADAPTIVE_CARD_NAME_SIZES[ADAPTIVE_CARD_NAME_SIZES.length - 1].className
  );
}
