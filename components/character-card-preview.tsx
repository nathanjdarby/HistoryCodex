"use client";

import type { PointerEvent, ReactNode } from "react";
import { PlatformCharacterCardRenderer } from "@/components/platform-character-card-renderer";
import { HolographicOverlay } from "@/components/holographic-overlay";
import { type AbilityEffect, type AbilityTrigger } from "@/lib/battle";
import type { CardType } from "@/lib/battle/types";
import type { CardLayout } from "@/lib/card-layout";
import type { ImageFrame } from "@/lib/image-frame";
import { toCardDesignData } from "@/lib/map-card-design-data";
import { RARITY_META, type RarityTier } from "@/lib/rarity";
import type { Archetype } from "@/lib/sprite/generateSprite";

export type CharacterCardDensity = "full" | "play" | "compact" | "mini";

export type CharacterCardPreviewProps = {
  name: string;
  rarity: RarityTier;
  cardType: CardType;
  cost: number;
  attack: number;
  defense: number;
  archetype: Archetype | null;
  era: { name: string; colorPrimary: string; colorSecondary: string };
  abilityName: string | null;
  abilityEffect: AbilityEffect | null;
  abilityValue: number | null;
  abilityTrigger: AbilityTrigger | null;
  flavorText: string | null;
  seed: string;
  imageUrl: string | null;
  imageFrame?: ImageFrame;
  holographic?: boolean;
  dexLabel: string;
  locked?: boolean;
  footer?: ReactNode;
  flavorFooter?: ReactNode;
  ownership?: {
    showStatus: boolean;
    owned: boolean;
    quantity?: number;
  };
  /** Legacy prop — close buttons live outside the card in modals. */
  reserveHeaderActionsSpace?: boolean;
  /** Affects shell sizing only; layout positions always come from card_layout_assignments. */
  density?: CharacterCardDensity;
  showCost?: boolean;
  showCombat?: boolean;
  /** When set, overrides density defaults for flavor text visibility. */
  showFlavor?: boolean;
  /** Fill a fixed-size shell (e.g. battle hand) without aspect-ratio fighting the parent. */
  embedded?: boolean;
  /** Optional layout override (otherwise loaded from card_layout_assignments). */
  cardLayout?: CardLayout;
  /** Per-card layout override from characters.layout_id */
  layoutId?: string | null;
  /** Registry-backed custom columns (house, future fields) — routed to card.extras, not per-field props. */
  extras?: Record<string, unknown>;
  className?: string;
  onImagePointerDown?: (event: PointerEvent<HTMLDivElement>) => void;
  onImagePointerMove?: (event: PointerEvent<HTMLDivElement>) => void;
  onImagePointerUp?: (event: PointerEvent<HTMLDivElement>) => void;
};

/**
 * Every density uses the global card aspect ratio from card_layout_settings
 * (via --card-aspect-ratio-w/h on :root). Layout positions are percentages
 * of that box, so the container shape must match what the Layout Designer uses.
 */
const DENSITY_SHELL: Record<CharacterCardDensity, string> = {
  full: "card-aspect-ratio rounded-2xl shadow-2xl",
  play: "card-aspect-ratio h-full w-full rounded-xl",
  compact: "card-aspect-ratio rounded-lg sm:rounded-xl",
  mini: "card-aspect-ratio rounded-md sm:rounded-lg",
};

const DENSITY_SHOW_FLAVOR: Record<CharacterCardDensity, boolean> = {
  full: true,
  play: false,
  compact: false,
  mini: false,
};

export function CharacterCardPreview({
  name,
  rarity,
  cardType,
  cost,
  attack,
  defense,
  archetype,
  era,
  abilityName,
  abilityEffect,
  abilityValue,
  abilityTrigger,
  flavorText,
  seed,
  imageUrl,
  imageFrame,
  holographic = false,
  dexLabel,
  locked = false,
  footer,
  flavorFooter,
  ownership,
  density = "full",
  showCost = true,
  showCombat = true,
  showFlavor,
  embedded = false,
  cardLayout: cardLayoutOverride,
  layoutId,
  extras,
  className = "",
  onImagePointerDown,
  onImagePointerMove,
  onImagePointerUp,
}: CharacterCardPreviewProps) {
  const meta = RARITY_META[rarity];
  const showFlavorSection = showFlavor ?? DENSITY_SHOW_FLAVOR[density];
  const shellClass = embedded ? "h-full w-full rounded-xl shadow-2xl" : DENSITY_SHELL[density];
  const showGlow = density === "full" || density === "play" || embedded;

  const card = toCardDesignData({
    name,
    rarity,
    cardType,
    cost,
    attack,
    defense,
    archetype,
    era,
    abilityName,
    abilityEffect,
    abilityValue,
    abilityTrigger,
    flavorText,
    imageUrl,
    imageFrame,
    dexLabel,
    locked,
    layoutId,
    extras,
  });

  return (
    <div
      className={`card-container dark relative w-full overflow-hidden border-2 text-left ${shellClass} ${className}`}
      style={{
        borderColor: meta.color,
        boxShadow: showGlow ? meta.glow : undefined,
        background: `linear-gradient(160deg, ${era.colorPrimary}2a, ${era.colorSecondary}2a), #0a0a0a`,
      }}
    >
      {holographic ? <HolographicOverlay /> : null}
      <PlatformCharacterCardRenderer
        card={card}
        seed={seed}
        cardType={cardType}
        layoutId={layoutId}
        cardLayout={cardLayoutOverride}
        showCost={showCost}
        showCombat={showCombat}
        showFlavor={showFlavorSection}
        ownership={ownership}
        footer={footer}
        flavorFooter={flavorFooter}
        className="relative z-[1] h-full w-full"
        onImagePointerDown={onImagePointerDown}
        onImagePointerMove={onImagePointerMove}
        onImagePointerUp={onImagePointerUp}
      />
    </div>
  );
}
