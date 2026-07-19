"use client";

import { CharacterCardPreview } from "@/components/character-card-preview";
import {
  battleCardFaceToPreviewProps,
  type BattleCardFace,
} from "@/components/battle/battle-card-face";

type Props = {
  card: BattleCardFace;
  highlight?: boolean;
  highlightLabel?: string;
  onClick?: () => void;
};

export function BattleDeckCard({ card, highlight, highlightLabel, onClick }: Props) {
  const previewProps = battleCardFaceToPreviewProps(card, {
    showCost: card.cost > 0,
  });

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full cursor-pointer text-left transition-transform hover:-translate-y-1 ${
        highlight ? "rounded-2xl ring-2 ring-amber-400 ring-offset-2 ring-offset-neutral-950" : ""
      }`}
    >
      {highlight && highlightLabel ? (
        <span className="absolute right-2 top-2 z-10 rounded-full bg-amber-600/90 px-2 py-0.5 text-[10px] font-medium text-amber-50 sm:right-3 sm:top-3">
          {highlightLabel}
        </span>
      ) : null}

      <CharacterCardPreview {...previewProps} density="full" />
    </button>
  );
}
