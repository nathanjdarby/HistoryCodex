import type { MatchEvent } from "@/lib/battle/types";

export function BattleLog({ entries }: { entries: MatchEvent[] }) {
  return (
    <section className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-3">
      <h3 className="mb-2 text-sm font-medium text-neutral-200">Battle log</h3>
      <ul className="max-h-64 space-y-1 overflow-y-auto text-xs text-neutral-400">
        {entries.length === 0 ? (
          <li>No events yet.</li>
        ) : (
          entries.map((entry) => (
            <li key={entry.at}>
              <span className="text-neutral-600">[{entry.type}]</span> {entry.message}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
