"use client";

import type { PointerEvent, ReactNode } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { CharacterArt } from "@/components/character-art";
import { ModalFlavorText } from "@/components/modal-flavor-text";
import {
  AbilityChip,
  AbilityPanelBody,
  AbilityPanelLabel,
  CharacterCardArchetypeBadge,
  CharacterCardAttackBadge,
  CharacterCardDefenseBadge,
  CharacterCardName,
  CharacterCardPowerBadge,
  CopyCountBadge,
  CharacterBadge,
  EventBadge,
  LocationBadge,
  RarityPill,
  StarRating,
  UnitBadge,
} from "@/components/character-badges";
import { hasCardAbility, type AbilityEffect, type AbilityTrigger } from "@/lib/battle";
import type { CardType } from "@/lib/battle/types";
import { layoutBoxStyle, type CardLayout, type LayoutBox } from "@/lib/card-layout";
import type { ImageFrame } from "@/lib/image-frame";
import { type RarityTier } from "@/lib/rarity";
import type { Archetype } from "@/lib/sprite/generateSprite";

function LayoutSlot({
  box,
  children,
  className = "",
}: {
  box: LayoutBox;
  children: ReactNode;
  className?: string;
}) {
  if (!box.visible) return null;
  return (
    <div className={`absolute overflow-hidden ${className}`} style={layoutBoxStyle(box)}>
      {children}
    </div>
  );
}

export type CharacterCardFullLayoutProps = {
  cardLayout: CardLayout;
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
  dexLabel: string;
  locked?: boolean;
  footer?: ReactNode;
  flavorFooter?: ReactNode;
  ownership?: {
    showStatus: boolean;
    owned: boolean;
    quantity?: number;
  };
  showCost?: boolean;
  showCombat?: boolean;
  showFlavor?: boolean;
  rarityLabel: string;
  rarityColor: string;
  onImagePointerDown?: (event: PointerEvent<HTMLDivElement>) => void;
  onImagePointerMove?: (event: PointerEvent<HTMLDivElement>) => void;
  onImagePointerUp?: (event: PointerEvent<HTMLDivElement>) => void;
};

export function CharacterCardFullLayout({
  cardLayout,
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
  dexLabel,
  locked = false,
  footer,
  flavorFooter,
  ownership,
  showCost = true,
  showCombat = true,
  showFlavor = true,
  rarityLabel,
  rarityColor,
  onImagePointerDown,
  onImagePointerMove,
  onImagePointerUp,
}: CharacterCardFullLayoutProps) {
  const isLocation = cardType === "location";
  const showAbilityPanel =
    hasCardAbility({ abilityName, abilityEffect, abilityTrigger }) || cardType === "location";
  const showCombatStats = showCombat && !isLocation;
  const showPowerBadge = showCost && cost > 0;

  return (
    <div className="relative h-full w-full">
      <LayoutSlot box={cardLayout.name}>
        <div className="name-slot">
          <CharacterCardName
            name={name}
            variant="prominent"
            nameStyle={{ color: rarityColor }}
            scaled
          />
        </div>
      </LayoutSlot>

      <LayoutSlot box={cardLayout.rarityPill}>
        <div className="rarity-pill-slot">
          <RarityPill label={rarityLabel} color={rarityColor} scaled />
        </div>
      </LayoutSlot>

      <LayoutSlot box={cardLayout.stars}>
        <div className="stars-slot">
          <StarRating rarity={rarity} scaled />
        </div>
      </LayoutSlot>

      <LayoutSlot box={cardLayout.artFrame}>
        <div className="card-art-frame">
          <CharacterArt
            seed={seed}
            imageUrl={imageUrl}
            imageFrame={imageFrame}
            era={era}
            rarity={rarity}
            archetype={archetype}
            size={640}
            className={`h-full w-full ${locked ? "opacity-40 grayscale" : ""}`}
            onImagePointerDown={onImagePointerDown}
            onImagePointerMove={onImagePointerMove}
            onImagePointerUp={onImagePointerUp}
          />
          {locked ? (
            <Lock className="card-icon-lock-lg absolute inset-0 m-auto text-foreground drop-shadow" />
          ) : null}
        </div>
      </LayoutSlot>

      {showPowerBadge ? (
        <LayoutSlot box={cardLayout.badgePwr}>
          <div className="stat-badge-slot">
            <CharacterCardPowerBadge cost={cost} color={rarityColor} scaled />
          </div>
        </LayoutSlot>
      ) : null}

      <LayoutSlot box={cardLayout.badgeArchetype}>
        <div className="stat-badge-slot">
          <CharacterCardArchetypeBadge archetype={archetype} color={rarityColor} scaled />
        </div>
      </LayoutSlot>

      {showCombatStats ? (
        <>
          <LayoutSlot box={cardLayout.badgeAtk}>
            <div className="stat-badge-slot">
              <CharacterCardAttackBadge attack={attack} color={rarityColor} scaled />
            </div>
          </LayoutSlot>
          <LayoutSlot box={cardLayout.badgeDef}>
            <div className="stat-badge-slot">
              <CharacterCardDefenseBadge defense={defense} color={rarityColor} scaled />
            </div>
          </LayoutSlot>
        </>
      ) : null}

      <LayoutSlot box={cardLayout.chipType}>
        <div className="chip-slot">
          {cardType === "character" ? <CharacterBadge scaled /> : null}
          {cardType === "location" ? <LocationBadge scaled /> : null}
          {cardType === "unit" ? <UnitBadge scaled /> : null}
          {cardType === "event" ? <EventBadge scaled /> : null}
        </div>
      </LayoutSlot>

      <LayoutSlot box={cardLayout.chipAbility}>
        <div className="chip-slot">
          <AbilityChip name={abilityName} scaled />
        </div>
      </LayoutSlot>

      {showAbilityPanel ? (
        <>
          <LayoutSlot box={cardLayout.abilityLabel}>
            <div className="ability-label-slot">
              <AbilityPanelLabel
                cardType={cardType}
                className="rounded-l-xl rounded-r-none border-r-0"
                scaled
              />
            </div>
          </LayoutSlot>
          <LayoutSlot box={cardLayout.abilityBody}>
            <div className="ability-body-slot">
              <AbilityPanelBody
                cardType={cardType}
                abilityName={abilityName}
                abilityEffect={abilityEffect}
                abilityValue={abilityValue}
                abilityTrigger={abilityTrigger}
                eraName={era.name}
                emptyText={cardType === "location" ? "No buff set" : undefined}
                className="rounded-l-none rounded-r-xl border-l-0"
                scaled
              />
            </div>
          </LayoutSlot>
        </>
      ) : null}

      <LayoutSlot box={cardLayout.eraName}>
        <div className="era-name-slot">
          <div className="card-era-box">
            <p className="card-text-era min-w-0 truncate font-semibold uppercase tracking-wide text-foreground">
              {era.name}
            </p>
          </div>
        </div>
      </LayoutSlot>

      <LayoutSlot box={cardLayout.eraDex}>
        <div className="era-dex-slot">
          <div className="card-era-box justify-end">
            {ownership?.owned && (ownership.quantity ?? 0) > 1 ? (
              <CopyCountBadge quantity={ownership.quantity ?? 0} scaled />
            ) : null}
            {ownership?.showStatus ? (
              <div
                className="card-era-status-badge"
                aria-label={ownership.owned ? "Unlocked" : "Locked"}
              >
                {ownership.owned ? (
                  <CheckCircle2 className="card-icon-status-sm text-emerald-400" />
                ) : (
                  <Lock className="card-icon-lock-sm text-muted" />
                )}
              </div>
            ) : null}
            <span className="card-text-dex shrink-0 font-mono text-muted">{dexLabel}</span>
          </div>
        </div>
      </LayoutSlot>

      {showFlavor ? (
        <LayoutSlot box={cardLayout.flavorText}>
          <div className="flavor-text-slot">
            <div className="card-flavor-box">
              <ModalFlavorText text={flavorText} scaled />
              {flavorFooter}
            </div>
          </div>
        </LayoutSlot>
      ) : null}

      <LayoutSlot box={cardLayout.cornerDex}>
        <div className="corner-dex-slot">
          {ownership?.showStatus ? (
            <div
              className="card-status-badge"
              aria-label={ownership.owned ? "Unlocked" : "Locked"}
              title={ownership.owned ? "Unlocked" : "Locked"}
            >
              {ownership.owned ? (
                <CheckCircle2 className="card-icon-status-lg text-emerald-700 dark:text-emerald-400" />
              ) : (
                <Lock className="card-icon-lock-md text-muted" />
              )}
            </div>
          ) : null}
          <span className="card-text-dex-corner font-mono leading-none text-foreground/80">{dexLabel}</span>
        </div>
      </LayoutSlot>

      {footer ? (
        <div className="absolute inset-x-0 bottom-0 z-20 rounded-xl border border-white/10 bg-black/40 p-[2cqw]">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
