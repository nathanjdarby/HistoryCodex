"use client";

import { useQuery } from "@tanstack/react-query";
import {
  DEFAULT_CARD_LAYOUT,
  DEFAULT_CARD_LAYOUT_SETTINGS,
  type CardLayout,
  type CardLayoutBundle,
  type CardLayoutSettings,
  type CardLayoutsByType,
  defaultCardLayoutBundle,
} from "@/lib/card-layout";
import type { CardType } from "@/lib/battle/types";

export const CARD_LAYOUTS_QUERY_KEY = ["card-layouts"] as const;

async function fetchCardLayoutBundle(): Promise<CardLayoutBundle> {
  const response = await fetch("/api/card-layouts");
  if (!response.ok) {
    throw new Error("Failed to load card layouts");
  }
  return response.json();
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
    placeholderData: defaultCardLayoutBundle(),
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

export function useCardLayout(cardType: CardType, override?: CardLayout): CardLayout {
  const layouts = useCardLayouts();
  if (override) return override;
  return layouts[cardType] ?? DEFAULT_CARD_LAYOUT;
}
