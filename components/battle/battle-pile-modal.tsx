"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { BattleDeckCard } from "@/components/battle/battle-deck-card";
import { cardSnapshotToFace, type BattleCardFace } from "@/components/battle/battle-card-face";
import type { CardSnapshot } from "@/lib/battle/types";

type Props = {
  title: string;
  cards: CardSnapshot[];
  topCardHint?: boolean;
  onInspect: (card: BattleCardFace) => void;
  onClose: () => void;
};

export function BattlePileModal({ title, cards, topCardHint = false, onInspect, onClose }: Props) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950">
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-800 px-4 py-3 sm:px-6">
        <div>
          <h3 className="text-base font-medium text-neutral-100 sm:text-lg">{title}</h3>
          {topCardHint ? (
            <p className="text-xs text-neutral-500 sm:text-sm">
              Top-left card is the next draw. Click a card to inspect it.
            </p>
          ) : (
            <p className="text-xs text-neutral-500 sm:text-sm">Click a card to inspect it.</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 bg-black/60 p-2 text-neutral-300 hover:text-white"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-5">
        {cards.length === 0 ? (
          <p className="py-16 text-center text-sm text-neutral-500">No cards.</p>
        ) : (
          <div className="mx-auto grid max-w-[96rem] grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-[repeat(4,minmax(0,1fr))] xl:grid-cols-[repeat(5,minmax(0,1fr))] 2xl:grid-cols-[repeat(6,minmax(0,1fr))]">
            {cards.map((card, index) => (
              <BattleDeckCard
                key={`${card.characterId}-${index}`}
                card={cardSnapshotToFace(card)}
                highlight={index === 0 && topCardHint}
                highlightLabel={index === 0 && topCardHint ? "Next draw" : undefined}
                onClick={() => onInspect(cardSnapshotToFace(card))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
