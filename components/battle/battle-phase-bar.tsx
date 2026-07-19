import type { Phase } from "@/lib/battle/types";

const PHASES: Phase[] = ["chronos", "logistics", "campaign", "consolidation"];

const PHASE_LABEL: Record<Phase, string> = {
  chronos: "Chronos",
  logistics: "Logistics",
  campaign: "Campaign",
  consolidation: "Consolidation",
};

type Props = {
  phase: Phase;
  turnNumber: number;
  cp: number;
  activePlayer: string;
  capturedLocations?: number;
  locationsToWin?: number;
};

export function BattlePhaseBar({
  phase,
  turnNumber,
  cp,
  activePlayer,
  capturedLocations = 0,
  locationsToWin = 2,
}: Props) {
  return (
    <div className="rounded-xl border border-amber-900/30 bg-gradient-to-r from-neutral-950 via-[#14100c] to-neutral-950 p-3 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {PHASES.map((p) => (
            <span
              key={p}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                p === phase
                  ? "bg-amber-700 text-amber-50 shadow-[0_0_12px_rgba(180,120,40,0.35)]"
                  : "bg-neutral-900/80 text-neutral-500"
              }`}
            >
              {PHASE_LABEL[p]}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-300">
          <span>Turn {turnNumber}</span>
          <span className="text-neutral-600">·</span>
          <span className={activePlayer === "player" ? "text-sky-300" : "text-red-300"}>
            {activePlayer === "player" ? "Your turn" : "AI turn"}
          </span>
          <span className="text-neutral-600">·</span>
          <span className="text-amber-300">{cp} CP</span>
          <span className="text-neutral-600">·</span>
          <span>
            Locations {capturedLocations}/{locationsToWin}
          </span>
        </div>
      </div>
    </div>
  );
}
