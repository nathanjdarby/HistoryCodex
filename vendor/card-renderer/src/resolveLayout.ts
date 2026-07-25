import { DEFAULT_LAYOUT_V2, normalizeLayout, type LayoutDocumentV2 } from "./layout";
import type { CardDesignData, CardType } from "./types";

export type LayoutAssignments = Record<CardType, string | null>;

export interface LayoutPresetRef {
  id: string;
  name: string;
  layout: unknown;
}

export interface ResolveLayoutInput {
  card: CardDesignData;
  presets: LayoutPresetRef[];
  assignments: LayoutAssignments;
  /** Row-level layout_id from characters table (optional). */
  cardLayoutId?: string | null;
}

export function resolveLayoutId(input: ResolveLayoutInput): string | null {
  if (input.card.layoutId) return input.card.layoutId;
  if (input.cardLayoutId) return input.cardLayoutId;
  const typeDefault = input.assignments[input.card.cardType];
  if (typeDefault) return typeDefault;
  const namedDefault = input.presets.find((p) => p.name === "Default");
  return namedDefault?.id || input.presets[0]?.id || null;
}

export function resolveCardLayout(input: ResolveLayoutInput): LayoutDocumentV2 {
  const layoutId = resolveLayoutId(input);
  const preset = input.presets.find((p) => p.id === layoutId);
  if (preset) return normalizeLayout(preset.layout);
  return DEFAULT_LAYOUT_V2;
}
