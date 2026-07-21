"use client";

import type { PointerEvent, ReactNode } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { CharacterArt } from "@/components/character-art";
import { ModalFlavorText } from "@/components/modal-flavor-text";
import { HolographicOverlay } from "@/components/holographic-overlay";
import {
  AbilityChip,
  AbilityDescription,
  CharacterCardArchetypeBadge,
  CharacterCardAttackBadge,
  CharacterCardCorner,
  CharacterCardDefenseBadge,
  CharacterCardHeader,
  CharacterCardPowerBadge,
  CopyCountBadge,
  EventBadge,
  LocationBadge,
  UnitBadge,
} from "@/components/character-badges";
import { hasCardAbility, type AbilityEffect, type AbilityTrigger } from "@/lib/battle";
import type { CardType } from "@/lib/battle/types";
import type { ImageFrame } from "@/lib/image-frame";
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
  /** Leave room for a close button over the header (collection modal). */
  reserveHeaderActionsSpace?: boolean;
  /** full = collection modal; play = in-match hand/board; compact = legacy; mini = tiny pile thumbnails */
  density?: CharacterCardDensity;
  showCost?: boolean;
  showCombat?: boolean;
  /** When set, overrides density config for flavor text (e.g. hide on scaled play cards). */
  showFlavor?: boolean;
  /** Fill a fixed-size play shell — same structure as full, no aspect-ratio shell fighting the parent. */
  embedded?: boolean;
  className?: string;
  onImagePointerDown?: (event: PointerEvent<HTMLDivElement>) => void;
  onImagePointerMove?: (event: PointerEvent<HTMLDivElement>) => void;
  onImagePointerUp?: (event: PointerEvent<HTMLDivElement>) => void;
};

const DENSITY = {
  full: {
    shell: "aspect-[3/5] rounded-2xl shadow-2xl sm:aspect-[5/7]",
    padding: "px-3.5 pb-3.5 pt-3 sm:px-4 sm:pb-3 sm:pt-3.5",
    headerVariant: "prominent" as const,
    headerNameClass: "text-lg font-bold leading-tight tracking-tight sm:text-xl",
    headerNameClamp: "",
    headerStarSize: 12,
    headerGap: "mb-2.5 sm:mb-3",
    art: "relative mb-2.5 w-full flex-1 overflow-hidden rounded-xl border border-white/10 bg-black/30 min-h-[14rem] sm:mb-2 sm:min-h-[12rem]",
    artSize: 240,
    badgeClass: "",
    badgeGap: "gap-1.5",
    badgeInset: "right-2 top-2 sm:right-2.5 sm:top-2.5",
    chipsWrap: "mt-2 shrink-0 rounded-xl border border-white/10 bg-black/25 p-2 sm:mt-1.5 sm:p-2",
    chipsGap: "gap-1.5",
    sectionGap: "mt-2 gap-2 sm:mt-1.5 sm:gap-1.5",
    abilityVariant: "panel" as const,
    eraTitle: "text-[10px] sm:text-xs",
    eraWrap: "rounded-xl",
    eraPadding: "px-2.5 py-1.5 sm:px-3 sm:py-1.5",
    showCorner: true,
    cornerVariant: "prominent" as const,
    showChips: true,
    showAbility: true,
    showEra: true,
    showFlavor: true,
    eraSingleRow: false,
  },
  play: {
    shell: "aspect-[5/7] h-full w-full rounded-xl",
    padding: "px-2 pb-2 pt-2 sm:px-2.5 sm:pb-2.5 sm:pt-2.5",
    headerVariant: "prominent" as const,
    headerNameClass: "text-[10px] font-bold leading-tight tracking-tight sm:text-[11px]",
    headerNameClamp: "line-clamp-1",
    headerStarSize: 8,
    headerGap: "mb-1.5 shrink-0",
    art: "relative mb-1.5 min-h-0 w-full flex-1 overflow-hidden rounded-lg border border-white/10 bg-black/30",
    artSize: 140,
    badgeClass: "!h-6 !w-6 [&_svg]:!size-2 [&_span]:!text-[7px] sm:!h-7 sm:!w-7 sm:[&_svg]:!size-2.5 sm:[&_span]:!text-[8px]",
    badgeGap: "gap-0.5",
    badgeInset: "right-1 top-1",
    chipsWrap: "mb-1 shrink-0 rounded-lg border border-white/10 bg-black/25 p-1 sm:p-1.5",
    chipsGap: "gap-1",
    sectionGap: "gap-1 shrink-0",
    abilityVariant: "panel-play" as const,
    eraTitle: "text-[8px] sm:text-[9px]",
    eraWrap: "rounded-lg",
    eraPadding: "px-1.5 py-1 sm:px-2 sm:py-1",
    eraSingleRow: true,
    showCorner: false,
    cornerVariant: "compact" as const,
    showChips: true,
    showAbility: true,
    showEra: true,
    showFlavor: false,
  },
  compact: {
    shell: "aspect-auto rounded-lg sm:rounded-xl",
    padding: "px-2 pb-2 pt-2 sm:px-2.5 sm:pb-2.5 sm:pt-2.5",
    headerVariant: "compact" as const,
    headerNameClass: "font-semibold leading-tight text-foreground",
    headerNameClamp: undefined as string | undefined,
    headerStarSize: 9,
    headerGap: "mb-1.5",
    art: "relative mb-1.5 h-[4.5rem] w-full shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/30 sm:h-[5rem]",
    artSize: 128,
    badgeClass: "!h-8 !w-8 [&_svg]:!size-2.5 [&_span]:!text-[9px] sm:!h-8 sm:!w-8",
    badgeGap: "gap-1",
    badgeInset: "right-1 top-1 sm:right-1.5 sm:top-1.5",
    chipsWrap: "mt-1.5 shrink-0 rounded-lg border border-white/10 bg-black/25 p-1.5",
    chipsGap: "gap-1",
    sectionGap: "mt-1.5 gap-1.5",
    abilityVariant: "panel-compact" as const,
    eraTitle: "text-[9px] sm:text-[10px]",
    eraWrap: "rounded-lg",
    eraPadding: "px-2 py-1 sm:px-2.5 sm:py-1.5",
    showCorner: false,
    cornerVariant: "compact" as const,
    showChips: true,
    showAbility: true,
    showEra: true,
    showFlavor: false,
    eraSingleRow: false,
  },
  mini: {
    shell: "aspect-auto rounded-md sm:rounded-lg",
    padding: "px-1 pb-1 pt-1",
    headerVariant: "compact" as const,
    headerNameClass: "font-semibold leading-tight text-foreground",
    headerNameClamp: undefined as string | undefined,
    headerStarSize: 7,
    headerGap: "mb-0.5",
    art: "relative mb-0.5 h-[2.75rem] w-full shrink-0 overflow-hidden rounded border border-white/10 bg-black/30 sm:h-[3rem]",
    artSize: 96,
    badgeClass: "!h-6 !w-6 [&_svg]:!size-2 [&_span]:!text-[8px]",
    badgeGap: "gap-0.5",
    badgeInset: "right-0.5 top-0.5",
    chipsWrap: "mt-0.5 shrink-0 rounded border border-white/10 bg-black/25 p-0.5",
    chipsGap: "gap-0.5",
    sectionGap: "mt-0.5 gap-0.5",
    abilityVariant: "panel-compact" as const,
    eraTitle: "text-[7px]",
    eraWrap: "rounded",
    eraPadding: "px-1 py-0.5",
    showCorner: false,
    cornerVariant: "compact" as const,
    showChips: true,
    showAbility: false,
    showEra: false,
    showFlavor: false,
    eraSingleRow: false,
  },
} as const;

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
  reserveHeaderActionsSpace = true,
  density = "full",
  showCost = true,
  showCombat = true,
  showFlavor,
  embedded = false,
  className = "",
  onImagePointerDown,
  onImagePointerMove,
  onImagePointerUp,
}: CharacterCardPreviewProps) {
  const meta = RARITY_META[rarity];
  const layout = DENSITY[density];
  const isLocation = cardType === "location";
  const showAbilityPanel =
    layout.showAbility &&
    (hasCardAbility({ abilityName, abilityEffect, abilityTrigger }) || cardType === "location");
  const showCombatStats = showCombat && !isLocation;
  const showPowerBadge = showCost && cost > 0;
  const showFlavorSection = showFlavor ?? layout.showFlavor;
  const shellClass = embedded ? "h-full w-full rounded-xl shadow-2xl" : layout.shell;
  const artClass = embedded
    ? "relative mb-2 min-h-0 w-full flex-1 overflow-hidden rounded-xl border border-white/10 bg-black/30 sm:mb-2"
    : layout.art;

  return (
    <div
      className={`dark relative flex w-full flex-col overflow-hidden border-2 text-left ${shellClass} ${className}`}
      style={{
        borderColor: meta.color,
        boxShadow: density === "full" || density === "play" ? meta.glow : undefined,
        background: `linear-gradient(160deg, ${era.colorPrimary}2a, ${era.colorSecondary}2a), #0a0a0a`,
      }}
    >
      {holographic ? <HolographicOverlay /> : null}

      <div className={`relative z-[1] flex min-h-0 flex-1 flex-col overflow-hidden ${layout.padding}`}>
        <div
          className={`relative shrink-0 ${layout.headerGap} ${
            reserveHeaderActionsSpace && density === "full" ? "pr-9 sm:pr-10" : ""
          }`}
        >
          <CharacterCardHeader
            name={name}
            rarity={rarity}
            variant={layout.headerVariant}
            nameClassName={layout.headerNameClass}
            nameStyle={density === "full" || density === "play" ? { color: meta.color } : undefined}
            nameClampClass={layout.headerNameClamp}
            starSize={layout.headerStarSize}
            rarityLabel={meta.label}
            rarityColor={meta.color}
          />
        </div>

        <div className={artClass}>
          <CharacterArt
            seed={seed}
            imageUrl={imageUrl}
            imageFrame={imageFrame}
            era={era}
            rarity={rarity}
            archetype={archetype}
            size={layout.artSize}
            className={`h-full w-full ${locked ? "opacity-40 grayscale" : ""}`}
            onImagePointerDown={onImagePointerDown}
            onImagePointerMove={onImagePointerMove}
            onImagePointerUp={onImagePointerUp}
          />
          <div
            className={`absolute z-10 flex flex-col items-end ${layout.badgeGap} ${layout.badgeInset}`}
          >
            {showPowerBadge ? (
              <CharacterCardPowerBadge cost={cost} color={meta.color} className={layout.badgeClass} />
            ) : null}
            <CharacterCardArchetypeBadge
              archetype={archetype}
              color={meta.color}
              className={layout.badgeClass}
            />
            {showCombatStats ? (
              <>
                <CharacterCardAttackBadge
                  attack={attack}
                  color={meta.color}
                  className={layout.badgeClass}
                />
                <CharacterCardDefenseBadge
                  defense={defense}
                  color={meta.color}
                  className={layout.badgeClass}
                />
              </>
            ) : null}
          </div>
          {locked ? (
            <Lock
              size={density === "full" ? 32 : density === "play" || density === "compact" ? 20 : 16}
              className="absolute inset-0 m-auto text-foreground drop-shadow"
            />
          ) : null}
        </div>

        {layout.showChips ? (
          <div className={layout.chipsWrap}>
            <div className={`flex flex-wrap items-center ${layout.chipsGap}`}>
              {cardType === "location" ? <LocationBadge size="compact" /> : null}
              {cardType === "unit" ? <UnitBadge size="compact" /> : null}
              {cardType === "event" ? <EventBadge size="compact" /> : null}
              <AbilityChip name={abilityName} size="compact" />
            </div>
          </div>
        ) : null}

        <div className={`flex shrink-0 flex-col ${layout.sectionGap}`}>
          {showAbilityPanel ? (
            <AbilityDescription
              cardType={cardType}
              abilityName={abilityName}
              abilityEffect={abilityEffect}
              abilityValue={abilityValue}
              abilityTrigger={abilityTrigger}
              eraName={era.name}
              variant={layout.abilityVariant}
              emptyText={cardType === "location" ? "No buff set" : undefined}
            />
          ) : null}

          {layout.showEra ? (
            <div className={`shrink-0 overflow-hidden border border-white/10 bg-black/30 ${layout.eraWrap}`}>
              {layout.eraSingleRow ? (
                <div className={`flex shrink-0 items-center justify-between gap-2 ${layout.eraPadding}`}>
                  <p
                    className={`min-w-0 truncate font-semibold uppercase tracking-wide text-foreground ${layout.eraTitle}`}
                  >
                    {era.name}
                  </p>
                  <span className={`shrink-0 font-mono text-muted ${layout.eraTitle}`}>{dexLabel}</span>
                </div>
              ) : (
                <>
                  <div
                    className={`flex shrink-0 items-center justify-between gap-2 ${showFlavorSection ? "border-b border-white/10" : ""} ${layout.eraPadding}`}
                  >
                    <p
                      className={`min-w-0 truncate font-semibold uppercase tracking-wide text-foreground ${layout.eraTitle}`}
                    >
                      {era.name}
                    </p>
                    <div className="flex shrink-0 items-center gap-1.5 sm:hidden">
                      {ownership?.owned && (ownership.quantity ?? 0) > 1 ? (
                        <CopyCountBadge quantity={ownership.quantity ?? 0} />
                      ) : null}
                      {ownership?.showStatus ? (
                        <div
                          className="rounded-full border border-white/10 bg-black/50 p-0.5"
                          aria-label={ownership.owned ? "Unlocked" : "Locked"}
                        >
                          {ownership.owned ? (
                            <CheckCircle2 size={14} className="text-emerald-400" />
                          ) : (
                            <Lock size={12} className="text-muted" />
                          )}
                        </div>
                      ) : null}
                      <span className="font-mono text-[10px] text-muted">{dexLabel}</span>
                    </div>
                  </div>
                  {showFlavorSection ? (
                    <>
                      <ModalFlavorText text={flavorText} />
                      {flavorFooter}
                    </>
                  ) : null}
                </>
              )}
            </div>
          ) : null}
        </div>

        {footer ? (
          <div className="mt-2 shrink-0 rounded-xl border border-white/10 bg-black/40 p-2 sm:mt-1.5 sm:p-1.5">
            {footer}
          </div>
        ) : null}
      </div>

      {layout.showCorner && !embedded ? (
        <CharacterCardCorner
          dexLabel={dexLabel}
          variant={layout.cornerVariant}
          showOwnershipStatus={ownership?.showStatus}
          owned={ownership?.owned}
          className="hidden sm:flex"
        />
      ) : null}
    </div>
  );
}
