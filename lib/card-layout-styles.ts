import type { CSSProperties } from "react";
import {
  CARD_ASPECT_RATIO_CSS_VARS,
  DEFAULT_CARD_LAYOUT_SETTINGS,
  type CardLayoutSettings,
} from "@/lib/card-layout";

export function cardAspectRatioCssProperties(
  settings: CardLayoutSettings = DEFAULT_CARD_LAYOUT_SETTINGS,
): CSSProperties {
  return {
    [CARD_ASPECT_RATIO_CSS_VARS.w]: String(settings.aspectRatioW),
    [CARD_ASPECT_RATIO_CSS_VARS.h]: String(settings.aspectRatioH),
  } as CSSProperties;
}
