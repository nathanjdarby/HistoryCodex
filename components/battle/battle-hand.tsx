import type { CardSnapshot, Phase } from "@/lib/battle/types";

type Props = {
  hand: CardSnapshot[];
  cp: number;
  phase: Phase;
  isPlayerTurn: boolean;
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
};

export function BattleHand({ hand, cp, phase, isPlayerTurn, selectedIndex, onSelect }: Props) {
  return (
    <section className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-200">Your hand</h3>
        <span className="text-xs text-amber-400">{cp} CP</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {hand.map((card, index) => {
          const affordable = card.cost <= cp;
          const playable =
            isPlayerTurn &&
            phase === "logistics" &&
            affordable &&
            (card.cardType === "character" || card.cardType === "unit" || card.cardType === "event");
          const selected = selectedIndex === index;
          return (
            <button
              key={`${card.characterId}-${index}`}
              type="button"
              disabled={!playable}
              onClick={() => onSelect(selected ? null : index)}
              className={`rounded-md border p-2 text-left transition-colors ${
                selected
                  ? "border-amber-500 bg-amber-950/30"
                  : playable
                    ? "border-neutral-700 hover:border-neutral-500"
                    : "border-neutral-800 opacity-50"
              }`}
            >
              <p className="truncate text-xs font-medium text-neutral-100">{card.name}</p>
              <p className="text-[10px] capitalize text-neutral-500">{card.cardType}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-neutral-400">
                <span>{card.cost} CP</span>
                {card.cardType !== "event" ? (
                  <span>
                    ATK {card.attack} · DEF {card.defense}
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
