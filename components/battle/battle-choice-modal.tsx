"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { BattleDeckCard } from "@/components/battle/battle-deck-card";
import { cardSnapshotToFace } from "@/components/battle/battle-card-face";
import type { PendingChoice } from "@/lib/battle/types";

type Props = {
  choice: PendingChoice;
  onConfirm: (payload: { selectedIndex?: number; topIndices?: number[] }) => void;
  onClose?: () => void;
};

export function BattleChoiceModal({ choice, onConfirm, onClose }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [topOrder, setTopOrder] = useState<number[]>(() => choice.revealedCards.map((_, i) => i));

  const title = useMemo(() => {
    switch (choice.kind) {
      case "scry":
        return `Scry — ${choice.eventName}`;
      case "search_deck":
        return `Search deck — ${choice.eventName}`;
      case "discard_to_hand":
        return `Recall from discard — ${choice.eventName}`;
      case "discard_draw":
        return `Discard to draw — ${choice.eventName}`;
      default:
        return choice.eventName;
    }
  }, [choice]);

  const hint = useMemo(() => {
    switch (choice.kind) {
      case "scry":
        return "Drag cards to set top-to-bottom order (left = top of deck).";
      case "search_deck":
        return "Choose one unit or character to add to your hand.";
      case "discard_to_hand":
        return "Choose a card to return to your hand.";
      case "discard_draw":
        return "Choose a card from your hand to discard, then draw 2.";
      default:
        return "";
    }
  }, [choice.kind]);

  function moveTopCard(from: number, to: number) {
    setTopOrder((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      if (item == null) return prev;
      next.splice(to, 0, item);
      return next;
    });
  }

  function handleConfirm() {
    if (choice.kind === "scry") {
      onConfirm({ topIndices: topOrder });
      return;
    }
    if (selectedIndex == null) return;
    onConfirm({ selectedIndex });
  }

  const canConfirm =
    choice.kind === "scry" || (selectedIndex != null && selectedIndex >= 0);

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-neutral-950/95">
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-800 px-4 py-3 sm:px-6">
        <div>
          <h3 className="text-base font-medium text-neutral-100 sm:text-lg">{title}</h3>
          <p className="text-xs text-neutral-500 sm:text-sm">{hint}</p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-black/60 p-2 text-neutral-300 hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-5">
        {choice.kind === "scry" ? (
          <div className="mx-auto flex max-w-4xl flex-wrap gap-3">
            {topOrder.map((cardIndex, position) => {
              const card = choice.revealedCards[cardIndex]!;
              return (
                <div key={`${card.characterId}-${cardIndex}`} className="w-[8rem] sm:w-[9rem]">
                  <p className="mb-1 text-center text-[10px] text-gold-bright">
                    {position === 0 ? "Top" : `#${position + 1}`}
                  </p>
                  <BattleDeckCard card={cardSnapshotToFace(card)} />
                  <div className="mt-1 flex justify-center gap-1">
                    <button
                      type="button"
                      disabled={position === 0}
                      onClick={() => moveTopCard(position, position - 1)}
                      className="rounded border border-neutral-700 px-2 py-0.5 text-xs disabled:opacity-40"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      disabled={position === topOrder.length - 1}
                      onClick={() => moveTopCard(position, position + 1)}
                      className="rounded border border-neutral-700 px-2 py-0.5 text-xs disabled:opacity-40"
                    >
                      →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {choice.revealedCards.map((card, index) => {
              const selectable =
                choice.kind !== "search_deck" ||
                card.cardType === "character" ||
                card.cardType === "unit";
              const selected = selectedIndex === index;
              return (
                <button
                  key={`${card.characterId}-${index}`}
                  type="button"
                  disabled={!selectable}
                  onClick={() => setSelectedIndex(index)}
                  className={`text-left ${!selectable ? "opacity-40" : ""} ${
                    selected ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-neutral-950 rounded-xl" : ""
                  }`}
                >
                  <BattleDeckCard card={cardSnapshotToFace(card)} />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex shrink-0 justify-end border-t border-neutral-800 px-4 py-3 sm:px-6">
        <button
          type="button"
          disabled={!canConfirm}
          onClick={handleConfirm}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:brightness-110 disabled:opacity-50"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
