"use client";

import type { PointerEvent, ReactNode } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { CardRenderer } from "@history-codex/card-renderer";
import type { CardDesignData } from "@history-codex/card-renderer";
import { CharacterArt } from "@/components/character-art";
import { CopyCountBadge } from "@/components/character-badges";
import { hasCardAbility } from "@/lib/battle";
import type { CardType } from "@/lib/battle/types";
import type { CardLayout } from "@/lib/card-layout";
import {
  useCardLayoutDocument,
  useCardPlatformRegistry,
  useCardLayoutBundle,
} from "@/lib/client/card-layouts";

export type PlatformCharacterCardRendererProps = {
  card: CardDesignData;
  seed: string;
  cardType: CardType;
  layoutId?: string | null;
  cardLayout?: CardLayout;
  showCost?: boolean;
  showCombat?: boolean;
  showFlavor?: boolean;
  ownership?: {
    showStatus: boolean;
    owned: boolean;
    quantity?: number;
  };
  footer?: ReactNode;
  flavorFooter?: ReactNode;
  layoutOnly?: boolean;
  className?: string;
  onImagePointerDown?: (event: PointerEvent<HTMLDivElement>) => void;
  onImagePointerMove?: (event: PointerEvent<HTMLDivElement>) => void;
  onImagePointerUp?: (event: PointerEvent<HTMLDivElement>) => void;
};

export function PlatformCharacterCardRenderer({
  card,
  seed,
  cardType,
  layoutId,
  cardLayout,
  showCost = true,
  showCombat = true,
  showFlavor = true,
  ownership,
  footer,
  flavorFooter,
  layoutOnly = true,
  className = "",
  onImagePointerDown,
  onImagePointerMove,
  onImagePointerUp,
}: PlatformCharacterCardRendererProps) {
  const layoutDoc = useCardLayoutDocument(cardType, layoutId);
  const registry = useCardPlatformRegistry();
  const { data: bundle } = useCardLayoutBundle();

  const showAbilityPanel =
    hasCardAbility({
      abilityName: card.abilityName,
      abilityEffect: card.abilityEffect as Parameters<typeof hasCardAbility>[0]["abilityEffect"],
      abilityTrigger: card.abilityTrigger as Parameters<typeof hasCardAbility>[0]["abilityTrigger"],
    }) || card.cardType === "location";

  return (
    <CardRenderer
      card={card}
      layout={cardLayout ?? layoutDoc}
      registry={registry}
      supportedRenderKinds={bundle?.supportedRenderKinds}
      layoutOnly={layoutOnly}
      className={className}
      footer={footer}
      renderArtFrame={() => (
        <div className="cd-art-frame card-art-frame h-full w-full">
          <CharacterArt
            seed={seed}
            imageUrl={card.imageUrl}
            imageFrame={card.imageFrame}
            era={card.era}
            rarity={card.rarity}
            archetype={card.archetype}
            size={640}
            className={`h-full w-full ${card.locked ? "opacity-40 grayscale" : ""}`}
            onImagePointerDown={onImagePointerDown}
            onImagePointerMove={onImagePointerMove}
            onImagePointerUp={onImagePointerUp}
          />
          {card.locked ? (
            <Lock className="card-icon-lock-lg absolute inset-0 m-auto text-foreground drop-shadow" />
          ) : null}
        </div>
      )}
      shouldShowElement={(elementTypeId, defaultVisible) => {
        if (elementTypeId === "badgePwr") return defaultVisible && showCost;
        if (elementTypeId === "badgeAtk" || elementTypeId === "badgeDef") {
          return defaultVisible && showCombat;
        }
        if (elementTypeId === "flavorText") return defaultVisible && showFlavor;
        if (elementTypeId === "abilityLabel" || elementTypeId === "abilityBody") {
          return defaultVisible && showAbilityPanel;
        }
        return defaultVisible;
      }}
      renderSlot={(elementTypeId, content) => {
        if (elementTypeId === "eraDex" && ownership) {
          return (
            <div className="cd-era-dex-slot">
              <div className="card-era-box justify-end">
                {ownership.owned && (ownership.quantity ?? 0) > 1 ? (
                  <CopyCountBadge quantity={ownership.quantity ?? 0} scaled />
                ) : null}
                {ownership.showStatus ? (
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
                <span className="card-text-dex shrink-0 font-mono text-muted">{card.dexLabel}</span>
              </div>
            </div>
          );
        }

        if (elementTypeId === "cornerDex" && ownership?.showStatus) {
          return (
            <div className="corner-dex-slot">
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
              <span className="card-text-dex-corner font-mono leading-none text-foreground/80">
                {card.dexLabel}
              </span>
            </div>
          );
        }

        if (elementTypeId === "flavorText" && flavorFooter) {
          return (
            <div className="cd-flavor-text-slot">
              <div className="card-flavor-box">
                {content}
                {flavorFooter}
              </div>
            </div>
          );
        }

        return content;
      }}
    />
  );
}
