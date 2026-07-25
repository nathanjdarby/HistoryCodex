"use client";

import { useEffect, useMemo, useRef } from "react";
import { X } from "lucide-react";
import { groupMatchLogByTurns, type LogTurnSection } from "@/lib/battle/group-match-log";
import type { MatchEvent } from "@/lib/battle/types";

type Props = {
  log: MatchEvent[];
  currentTurn?: number;
  onClose: () => void;
};

const TYPE_LABELS: Record<string, string> = {
  setup: "Setup",
  phase: "Phase",
  chronos: "Chronos",
  event: "Event",
  scry: "Scry",
  search: "Search",
  recall: "Recall",
  attack_declared: "Attack",
  damage_dealt: "Damage",
  influence_established: "Establish Influence",
  influence_passive: "Consolidation",
  influence_event: "Event Influence",
  influence_blocked: "Influence Blocked",
  establish_influence: "Establish Influence",
  leader_bonus: "Leader Bonus",
  location_played: "Location",
  location_deck_shuffled: "Location Deck",
  influence_reset: "Influence Reset",
  capture: "Capture",
  victory: "Victory",
  deploy: "Deploy",
  unification: "Unification",
  trigger: "Trigger",
  death_trigger: "Death Trigger",
  merchant_refund: "Merchant",
  scholar_draw: "Scholar",
  deck_exhausted: "Deck Exhausted",
  historical_exhaustion: "Historical Exhaustion",
};

function labelForType(type: string): string {
  return TYPE_LABELS[type] ?? type.replace(/_/g, " ");
}

function toneForType(type: string): string {
  if (type.startsWith("influence") || type === "establish_influence") {
    return "border-amber-800/50 bg-amber-950/30 text-amber-100/90";
  }
  if (type === "event" || type === "influence_event") {
    return "border-violet-800/50 bg-violet-950/30 text-violet-100/90";
  }
  if (type === "attack_declared" || type === "damage_dealt") {
    return "border-red-800/50 bg-red-950/25 text-red-100/90";
  }
  if (type === "capture" || type === "victory") {
    return "border-emerald-800/50 bg-emerald-950/30 text-emerald-100/90";
  }
  if (type === "phase" || type === "chronos" || type === "setup") {
    return "border-neutral-700/50 bg-neutral-900/50 text-neutral-300";
  }
  return "border-neutral-800/60 bg-neutral-950/50 text-neutral-200";
}

function actorLaneClass(actor: "player" | "ai" | "setup"): string {
  if (actor === "player") return "border-sky-900/40 bg-sky-950/10";
  if (actor === "ai") return "border-red-900/40 bg-red-950/10";
  return "border-neutral-800/60 bg-neutral-900/20";
}

function actorLabelClass(actor: "player" | "ai" | "setup"): string {
  if (actor === "player") return "text-sky-300/90";
  if (actor === "ai") return "text-red-300/90";
  return "text-neutral-400";
}

function LogEntryCard({ entry, index }: { entry: MatchEvent; index: number }) {
  return (
    <article className={`rounded-md border px-2.5 py-2 shadow-sm ${toneForType(entry.type)}`}>
      <div className="mb-1 flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-medium text-neutral-500">#{index + 1}</span>
        <span className="rounded-full border border-current/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide opacity-85">
          {labelForType(entry.type)}
        </span>
      </div>
      <p className="text-xs leading-relaxed">{entry.message}</p>
    </article>
  );
}

function TurnColumn({
  section,
  isCurrent,
  entryOffset,
  columnRef,
}: {
  section: LogTurnSection;
  isCurrent: boolean;
  entryOffset: number;
  columnRef?: (node: HTMLDivElement | null) => void;
}) {
  let counter = entryOffset;

  return (
    <div
      ref={columnRef}
      className={`flex w-[17.5rem] shrink-0 flex-col overflow-hidden rounded-xl border sm:w-72 ${
        isCurrent
          ? "border-sky-700/60 bg-neutral-900/80 shadow-[0_0_0_1px_rgba(56,189,248,0.15)]"
          : "border-neutral-800 bg-neutral-900/40"
      }`}
    >
      <header
        className={`shrink-0 border-b px-3 py-2.5 ${
          isCurrent ? "border-sky-800/50 bg-sky-950/20" : "border-neutral-800 bg-neutral-950/60"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <h4 className={`text-sm font-semibold ${isCurrent ? "text-sky-200" : "text-neutral-200"}`}>
            {section.label}
          </h4>
          {isCurrent ? (
            <span className="rounded-full bg-sky-900/80 px-2 py-0.5 text-[10px] font-medium text-sky-300">
              Current
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-[10px] text-neutral-500">
          {section.subsections.reduce((count, lane) => count + lane.entries.length, 0)} events
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
        {section.subsections.map((subsection) => (
          <div
            key={`${section.turn}-${subsection.actor}-${subsection.label}`}
            className={`rounded-lg border p-2 ${actorLaneClass(subsection.actor)}`}
          >
            <p className={`mb-2 text-[10px] font-semibold uppercase tracking-wider ${actorLabelClass(subsection.actor)}`}>
              {subsection.label}
            </p>
            <div className="flex flex-col gap-2">
              {subsection.entries.length === 0 ? (
                <p className="py-2 text-center text-[11px] text-neutral-600">No events</p>
              ) : (
                subsection.entries.map((entry) => {
                  const index = counter++;
                  return <LogEntryCard key={`${entry.at}-${index}`} entry={entry} index={index} />;
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BattleLogModal({ log, currentTurn, onClose }: Props) {
  const boardRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const sections = useMemo(() => groupMatchLogByTurns(log), [log]);

  const entryOffsets = useMemo(() => {
    const offsets: number[] = [];
    let total = 0;
    for (const section of sections) {
      offsets.push(total);
      for (const subsection of section.subsections) {
        total += subsection.entries.length;
      }
    }
    return offsets;
  }, [sections]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (currentTurn == null) return;
    const key = String(currentTurn);
    const column = columnRefs.current.get(key);
    const board = boardRef.current;
    if (!column || !board) return;

    const boardRect = board.getBoundingClientRect();
    const columnRect = column.getBoundingClientRect();
    const offset =
      column.offsetLeft - board.offsetLeft - boardRect.width / 2 + columnRect.width / 2;

    board.scrollTo({ left: Math.max(0, offset), behavior: "smooth" });
  }, [currentTurn, sections.length]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950/98 backdrop-blur-sm">
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-800 px-4 py-3 sm:px-6">
        <div>
          <h3 className="text-base font-medium text-neutral-100 sm:text-lg">Match log</h3>
          <p className="text-xs text-neutral-500 sm:text-sm">
            Kanban view — scroll horizontally across turns, vertically within each column
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 bg-black/60 p-2 text-neutral-300 hover:text-white"
          aria-label="Close match log"
        >
          <X size={18} />
        </button>
      </div>

      {log.length === 0 ? (
        <p className="py-16 text-center text-sm text-neutral-500">No log entries yet.</p>
      ) : (
        <div ref={boardRef} className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex h-full min-w-min items-stretch gap-3 p-3 sm:gap-4 sm:p-4">
            {sections.map((section, sectionIndex) => {
              const columnKey = section.turn == null ? "setup" : String(section.turn);
              const isCurrent = section.turn != null && section.turn === currentTurn;

              return (
                <TurnColumn
                  key={columnKey}
                  section={section}
                  isCurrent={isCurrent}
                  entryOffset={entryOffsets[sectionIndex] ?? 0}
                  columnRef={(node) => {
                    if (node) columnRefs.current.set(columnKey, node);
                    else columnRefs.current.delete(columnKey);
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
