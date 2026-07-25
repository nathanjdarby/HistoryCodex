import { BUILTIN_REGISTRY } from "@history-codex/card-renderer/builtinRegistry";
import {
  DEFAULT_LAYOUT_V2,
  LAYOUT_ELEMENT_IDS,
  PACKAGE_VERSION,
  SUPPORTED_RENDER_KINDS,
  normalizeLayout,
  type LayoutDocumentV2,
  type LayoutElementId,
} from "@history-codex/card-renderer/layout";
import { buildRegistry, type ElementRegistry, type RegistryRow } from "@history-codex/card-renderer/registry";
import { resolveCardLayout } from "@history-codex/card-renderer/resolveLayout";
import type { CardType } from "@/lib/battle/types";
import {
  DEFAULT_CARD_LAYOUT,
  type CardLayout,
  type LayoutAssignmentsByType,
  type LayoutPresetRef,
} from "@/lib/card-layout";

export { BUILTIN_REGISTRY, PACKAGE_VERSION, SUPPORTED_RENDER_KINDS, normalizeLayout, resolveCardLayout };
export type { LayoutAssignmentsByType, LayoutPresetRef } from "@/lib/card-layout";

export type SerializableRegistry = {
  fields: RegistryRow[];
  elements: RegistryRow[];
};

export function buildRegistryFromRows(
  fieldRows: RegistryRow[],
  elementRows: RegistryRow[],
): ElementRegistry {
  if (fieldRows.length === 0 && elementRows.length === 0) {
    return BUILTIN_REGISTRY;
  }
  return buildRegistry(fieldRows, elementRows);
}

/** Maps v2 layout instances onto the legacy fixed-key shape the current full-layout renderer uses. */
export function layoutDocumentToLegacyV1(doc: LayoutDocumentV2): CardLayout {
  const legacy = structuredClone(DEFAULT_CARD_LAYOUT);
  for (const instance of doc.elements) {
    if (!LAYOUT_ELEMENT_IDS.includes(instance.element_type_id as LayoutElementId)) continue;
    const id = instance.element_type_id as LayoutElementId;
    legacy[id] = {
      x: instance.x,
      y: instance.y,
      w: instance.w,
      h: instance.h,
      visible: instance.visible,
      z: instance.z,
    };
  }
  return legacy;
}

export function resolveLegacyLayoutForCard(input: {
  cardType: CardType;
  layoutId?: string | null;
  presets: LayoutPresetRef[];
  assignments: LayoutAssignmentsByType;
}): CardLayout {
  return layoutDocumentToLegacyV1(resolveLayoutDocumentForCard(input));
}

export function resolveLayoutDocumentForCard(input: {
  cardType: CardType;
  layoutId?: string | null;
  presets: LayoutPresetRef[];
  assignments: LayoutAssignmentsByType;
}): LayoutDocumentV2 {
  return resolveCardLayout({
    card: {
      ...blankCardDesignStub(input.cardType),
      layoutId: input.layoutId ?? null,
    },
    presets: input.presets,
    assignments: input.assignments,
    cardLayoutId: input.layoutId ?? null,
  });
}

function blankCardDesignStub(cardType: CardType) {
  return {
    name: "",
    rarity: "common" as const,
    cardType,
    cost: 0,
    attack: 0,
    defense: 0,
    archetype: null,
    era: { name: "", colorPrimary: "#3f3f46", colorSecondary: "#3f3f46" },
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
    layoutId: null as string | null,
  };
}

export function defaultLayoutDocument(): LayoutDocumentV2 {
  return DEFAULT_LAYOUT_V2;
}
