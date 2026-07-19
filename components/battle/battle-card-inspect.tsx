"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { CharacterCardPreview } from "@/components/character-card-preview";
import {
  battleCardFaceToPreviewProps,
  type BattleCardFace,
} from "@/components/battle/battle-card-face";

type Props = {
  card: BattleCardFace;
  onClose: () => void;
};

export function BattleCardInspect({ card, onClose }: Props) {
  const isLocation = card.cardType === "location";
  const previewProps = battleCardFaceToPreviewProps(card, {
    showCost: true,
    showCombat: !isLocation,
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center p-1.5 sm:p-3">
        <div className="my-auto flex w-full flex-col items-center" onClick={(event) => event.stopPropagation()}>
          <div className="relative w-[min(98vw,34rem,calc((100dvh-2rem)*5/7))] max-h-[min(calc(100dvh-2rem),52rem)] sm:max-h-[min(calc(100dvh-2.5rem),52rem)] sm:w-[min(34rem,calc((100dvh-2.5rem)*5/7))]">
            <CharacterCardPreview
              {...previewProps}
              density="full"
              reserveHeaderActionsSpace
            />

            <button
              type="button"
              onClick={onClose}
              className="absolute right-2.5 top-2.5 z-20 rounded-full border border-white/10 bg-black/50 p-1.5 text-neutral-400 hover:text-neutral-100"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
