"use client";

import { useLayoutEffect } from "react";
import { CARD_ASPECT_RATIO_CSS_VARS, DEFAULT_CARD_LAYOUT_SETTINGS } from "@/lib/card-layout";
import { useCardLayoutBundle } from "@/lib/client/card-layouts";

/** Keeps :root aspect-ratio CSS vars in sync after client refetches. */
export function CardLayoutsProvider({ children }: { children: React.ReactNode }) {
  const { data } = useCardLayoutBundle();
  const settings = data?.settings ?? DEFAULT_CARD_LAYOUT_SETTINGS;

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.style.setProperty(CARD_ASPECT_RATIO_CSS_VARS.w, String(settings.aspectRatioW));
    root.style.setProperty(CARD_ASPECT_RATIO_CSS_VARS.h, String(settings.aspectRatioH));
  }, [settings.aspectRatioH, settings.aspectRatioW]);

  return children;
}
