"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DEFAULT_CARD_LAYOUT,
  DEFAULT_CARD_LAYOUT_SETTINGS,
  type CardLayout,
  type CardPlatformBundle,
  type CardLayoutSettings,
  type CardLayoutsByType,
  defaultCardLayoutBundle,
} from "@/lib/card-layout";
import {
  buildRegistryFromRows,
  resolveLayoutDocumentForCard,
  resolveLegacyLayoutForCard,
} from "@/lib/card-platform-bridge";
import { BUILTIN_REGISTRY } from "@history-codex/card-renderer/builtinRegistry";
import {
  DEFAULT_LAYOUT_V2,
  normalizeLayout,
  type LayoutDocumentV2,
} from "@history-codex/card-renderer/layout";
import type { ElementRegistry } from "@history-codex/card-renderer/registry";
import type { CardType } from "@/lib/battle/types";

export const CARD_LAYOUTS_QUERY_KEY = ["card-layouts"] as const;

async function fetchCardLayoutBundle(): Promise<CardPlatformBundle> {
  const response = await fetch("/api/card-layouts");
  if (!response.ok) {
    throw new Error("Failed to load card layouts");
  }
  return response.json();
}

function defaultPlatformBundle(): CardPlatformBundle {
  const base = defaultCardLayoutBundle();
  return {
    ...base,
    presets: [],
    assignments: { character: null, unit: null, location: null, event: null },
    registry: { fields: [], elements: [] },
    supportedRenderKinds: [],
    packageVersion: "0.0.0",
  };
}

export function cardLayoutBundleQueryOptions() {
  return {
    queryKey: CARD_LAYOUTS_QUERY_KEY,
    queryFn: fetchCardLayoutBundle,
    staleTime: 30_000,
  } as const;
}

export function useCardLayoutBundle() {
  return useQuery({
    ...cardLayoutBundleQueryOptions(),
    refetchOnMount: "always",
    placeholderData: defaultPlatformBundle(),
  });
}

export function useCardLayouts(): CardLayoutsByType {
  const { data } = useCardLayoutBundle();
  return data?.layouts ?? defaultCardLayoutBundle().layouts;
}

export function useCardLayoutSettings(): CardLayoutSettings {
  const { data } = useCardLayoutBundle();
  return data?.settings ?? DEFAULT_CARD_LAYOUT_SETTINGS;
}

export function useCardLayout(
  cardType: CardType,
  override?: CardLayout,
  layoutId?: string | null,
): CardLayout {
  const { data } = useCardLayoutBundle();

  return useMemo(() => {
    if (override) return override;
    if (!data) return DEFAULT_CARD_LAYOUT;
    if (layoutId && data.presets.length > 0) {
      return resolveLegacyLayoutForCard({
        cardType,
        layoutId,
        presets: data.presets,
        assignments: data.assignments,
      });
    }
    return data.layouts[cardType] ?? DEFAULT_CARD_LAYOUT;
  }, [override, data, cardType, layoutId]);
}

export function useCardLayoutDocument(
  cardType: CardType,
  layoutId?: string | null,
): LayoutDocumentV2 {
  const { data } = useCardLayoutBundle();

  return useMemo(() => {
    if (!data) return DEFAULT_LAYOUT_V2;
    if (data.presets.length > 0) {
      return resolveLayoutDocumentForCard({
        cardType,
        layoutId,
        presets: data.presets,
        assignments: data.assignments,
      });
    }
    return normalizeLayout(data.layouts[cardType] ?? DEFAULT_CARD_LAYOUT);
  }, [data, cardType, layoutId]);
}

export function useCardPlatformRegistry(): ElementRegistry {
  const { data } = useCardLayoutBundle();

  return useMemo(() => {
    if (!data?.registry?.fields?.length && !data?.registry?.elements?.length) {
      return BUILTIN_REGISTRY;
    }
    return buildRegistryFromRows(data.registry.fields, data.registry.elements);
  }, [data]);
}
