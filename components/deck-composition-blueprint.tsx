import { CARD_TYPE_LABELS_PLURAL, type CardType } from "@/lib/card-types";
import { compositionProgress } from "@/lib/client/deck-builder";

function statusClass(inRange: boolean, count: number, min: number) {
  if (count === 0) return "text-neutral-500";
  if (inRange) return "text-emerald-300";
  if (count < min) return "text-amber-300";
  return "text-red-300";
}

export function DeckCompositionBlueprint({
  typeCounts,
  compact = false,
}: {
  typeCounts: Record<CardType, number>;
  compact?: boolean;
}) {
  const rows = compositionProgress(typeCounts);

  if (compact) {
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {rows.map(({ cardType, count, range, inRange }) => (
          <span key={cardType} className={statusClass(inRange, count, range.min)}>
            {CARD_TYPE_LABELS_PLURAL[cardType]} {count}/{range.min}–{range.max}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950/50 p-4">
      <h3 className="text-sm font-medium text-neutral-100">Baseline blueprint (40 cards)</h3>
      <p className="mt-1 text-xs text-neutral-500">
        Units are your frontline (~50%), events provide tactics (~22%), locations buff the field (~18%),
        and characters are high-impact heroes (~10%).
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {rows.map(({ cardType, count, range, inRange }) => {
          const pct = Math.round((range.min / 40) * 1000) / 10;
          return (
            <div
              key={cardType}
              className="flex items-center justify-between gap-3 rounded-md border border-neutral-800/80 bg-neutral-900/40 px-3 py-2"
            >
              <div>
                <p className="text-sm text-neutral-200">{CARD_TYPE_LABELS_PLURAL[cardType]}</p>
                <p className="text-[11px] text-neutral-500">
                  Target {range.min}–{range.max} · ~{pct}%
                </p>
              </div>
              <span className={`text-sm font-medium tabular-nums ${statusClass(inRange, count, range.min)}`}>
                {count}/{range.min}–{range.max}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
