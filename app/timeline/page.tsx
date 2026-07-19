"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Calendar, Layers, StickyNote, User, X, Plus } from "lucide-react";
import type { Era, TimelineEntry } from "@/lib/types";
import { formatYear } from "@/lib/format";
import { entryFractionalEnd, entryFractionalStart, formatEntryDateRange } from "@/lib/entry-dates";
import {
  assignEraLanes,
  entryToFractionalYear,
  fractionalYearToX,
  gridlineMonths,
  gridlineYears,
  niceYearStep,
} from "@/lib/timeline";

async function fetchEras(): Promise<Era[]> {
  const res = await fetch("/api/eras");
  if (!res.ok) throw new Error("Failed to load eras");
  return res.json();
}

async function fetchEntries(): Promise<TimelineEntry[]> {
  const res = await fetch("/api/entries");
  if (!res.ok) throw new Error("Failed to load entries");
  return res.json();
}

const KIND_ORDER: TimelineEntry["kind"][] = ["book", "event", "person", "note"];
const KIND_META: Record<TimelineEntry["kind"], { label: string; icon: typeof BookOpen; color: string }> = {
  book: { label: "Books", icon: BookOpen, color: "#f59e0b" },
  event: { label: "Events", icon: Calendar, color: "#38bdf8" },
  person: { label: "People", icon: User, color: "#a78bfa" },
  note: { label: "Notes", icon: StickyNote, color: "#4ade80" },
};

const ZOOM_LEVELS = [
  { label: "Century", pxPerYear: 0.6, granularity: "year" as const },
  { label: "Decade", pxPerYear: 2.2, granularity: "year" as const },
  { label: "Year", pxPerYear: 8, granularity: "year" as const },
  { label: "Month", pxPerYear: 72, granularity: "month" as const },
];

const SIDEBAR_WIDTH = 144;
const ERA_LANE_HEIGHT = 46;
const ENTRY_LANE_HEIGHT = 88;
const AXIS_HEIGHT = 44;
const PADDING_YEARS = 30;
const DEFAULT_FLOOR_YEAR = -3000;

export default function TimelinePage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: eras } = useQuery({ queryKey: ["eras"], queryFn: fetchEras });
  const { data: entries } = useQuery({ queryKey: ["entries"], queryFn: fetchEntries });
  const [zoomIdx, setZoomIdx] = useState(2);
  const [selected, setSelected] = useState<TimelineEntry | null>(null);

  const zoom = ZOOM_LEVELS[zoomIdx];
  const pxPerYear = zoom.pxPerYear;
  const currentYear = new Date().getFullYear();
  const hasTimelines = (eras?.length ?? 0) > 0;

  const { minYear, maxYear, laneOf, eraLaneCount } = useMemo(() => {
    const eraList = eras ?? [];
    const entryList = entries ?? [];
    let min = DEFAULT_FLOOR_YEAR;
    let max = currentYear;
    for (const era of eraList) {
      min = Math.min(min, era.startYear);
      max = Math.max(max, era.endYear);
    }
    for (const entry of entryList) {
      min = Math.min(min, entryFractionalStart(entry));
      max = Math.max(max, entryFractionalEnd(entry));
    }
    const laneOf = assignEraLanes(eraList);
    const eraLaneCount = Math.max(1, laneOf.size ? Math.max(...laneOf.values()) + 1 : 1);
    return { minYear: min - PADDING_YEARS, maxYear: max + PADDING_YEARS, laneOf, eraLaneCount };
  }, [eras, entries, currentYear]);

  const toX = (fractionalYear: number) => fractionalYearToX(fractionalYear, minYear, pxPerYear);
  const totalWidth = Math.max(1200, toX(maxYear + 1));
  const eraStripHeight = eraLaneCount * ERA_LANE_HEIGHT;
  const totalHeight = AXIS_HEIGHT + eraStripHeight + KIND_ORDER.length * ENTRY_LANE_HEIGHT;

  const yearGrid = useMemo(() => {
    const step = niceYearStep(pxPerYear);
    return gridlineYears(minYear, maxYear, step);
  }, [minYear, maxYear, pxPerYear]);

  const monthGrid = useMemo(() => {
    if (zoom.granularity !== "month") return [];
    return gridlineMonths(minYear, maxYear, pxPerYear);
  }, [zoom.granularity, minYear, maxYear, pxPerYear]);

  const entryLabelMaxWidth = zoom.granularity === "month" ? 120 : zoom.pxPerYear >= 6 ? 96 : 72;
  const markerSize = zoom.granularity === "month" ? 30 : zoom.pxPerYear >= 6 ? 28 : 24;

  function jumpToEra(eraId: string) {
    const era = eras?.find((e) => String(e.id) === eraId);
    if (!era || !scrollRef.current) return;
    scrollRef.current.scrollTo({ left: Math.max(0, toX(era.startYear) - 80), behavior: "smooth" });
  }

  return (
    <div className="flex min-h-[calc(100dvh-9rem)] flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-amber-100">Timeline</h1>
          <p className="text-sm text-neutral-400">
            Scroll horizontally through history. Switch zoom to years or months for more detail.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/profile/timelines"
            className="flex items-center gap-1 rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-900"
          >
            <Layers size={14} />
            My timelines
          </Link>
          <select
            onChange={(e) => e.target.value && jumpToEra(e.target.value)}
            defaultValue=""
            disabled={!hasTimelines}
            className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm disabled:opacity-50"
          >
            <option value="" disabled>
              Jump to era...
            </option>
            {eras?.map((era) => (
              <option key={era.id} value={era.id}>
                {era.name}
              </option>
            ))}
          </select>
          <div className="flex rounded-md border border-neutral-700 bg-neutral-900 p-0.5 text-sm">
            {ZOOM_LEVELS.map((level, i) => (
              <button
                key={level.label}
                onClick={() => setZoomIdx(i)}
                className={`rounded px-2.5 py-1 ${
                  i === zoomIdx ? "bg-amber-700 text-amber-50" : "text-neutral-400 hover:text-neutral-100"
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
          <Link
            href="/entries/new"
            className="flex items-center gap-1 rounded-md bg-amber-700 px-3 py-1.5 text-sm font-medium text-amber-50 hover:bg-amber-600"
          >
            <Plus size={14} />
            Entry
          </Link>
        </div>
      </div>

      {!hasTimelines && (
        <div className="rounded-xl border border-dashed border-amber-800/40 bg-amber-950/20 p-6 text-center">
          <p className="text-neutral-200">You haven&apos;t added any timelines to your profile yet.</p>
          <p className="mt-1 text-sm text-neutral-400">
            Pick the historical periods you want to explore — British, Roman, medieval, or anything
            else in the catalog.
          </p>
          <Link
            href="/profile/timelines"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-amber-600"
          >
            <Layers size={15} />
            Choose my timelines
          </Link>
        </div>
      )}

      {hasTimelines && (
        <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 shadow-lg">
          <div
            className="shrink-0 border-r border-neutral-800 bg-neutral-950/90"
            style={{ width: SIDEBAR_WIDTH }}
          >
            <div style={{ height: AXIS_HEIGHT }} className="border-b border-neutral-900" />
            <div
              style={{ height: eraStripHeight }}
              className="flex items-center justify-center border-b border-neutral-900 px-3"
            >
              <span className="text-center text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                Eras
              </span>
            </div>
            {KIND_ORDER.map((kind) => {
              const Meta = KIND_META[kind];
              const Icon = Meta.icon;
              return (
                <div
                  key={kind}
                  style={{ height: ENTRY_LANE_HEIGHT }}
                  className="flex items-center gap-2 border-b border-neutral-900 px-3 text-sm text-neutral-400"
                >
                  <Icon size={15} style={{ color: Meta.color }} />
                  {Meta.label}
                </div>
              );
            })}
          </div>

          <div ref={scrollRef} className="min-h-[min(70dvh,720px)] flex-1 overflow-x-auto overflow-y-hidden">
            <div className="relative" style={{ width: totalWidth, height: totalHeight, minHeight: "100%" }}>
              <div className="absolute inset-0">
                {zoom.granularity === "month"
                  ? monthGrid.map(({ year, month, label, major }) => (
                      <div
                        key={`${year}-${month}`}
                        className="absolute top-0 flex flex-col items-start"
                        style={{
                          left: toX(year + (month - 1) / 12),
                          height: totalHeight,
                        }}
                      >
                        <div
                          className={`h-full w-px ${major ? "bg-neutral-700" : "bg-neutral-900/80"}`}
                        />
                        {label && (
                          <span
                            className={`absolute top-1 -translate-x-1/2 whitespace-nowrap ${
                              major ? "text-[11px] font-medium text-neutral-400" : "text-[10px] text-neutral-600"
                            }`}
                          >
                            {major ? label : label}
                          </span>
                        )}
                      </div>
                    ))
                  : yearGrid.map((year) => (
                      <div
                        key={year}
                        className="absolute top-0 flex flex-col items-start"
                        style={{ left: toX(year), height: totalHeight }}
                      >
                        <div className="h-full w-px bg-neutral-800" />
                        <span className="absolute top-1 -translate-x-1/2 whitespace-nowrap text-[11px] text-neutral-500">
                          {formatYear(year)}
                        </span>
                      </div>
                    ))}
              </div>

              <div
                className="absolute left-0 w-full border-b border-neutral-900/60"
                style={{ top: AXIS_HEIGHT, height: eraStripHeight }}
              >
                {eras?.map((era) => {
                  const lane = laneOf.get(era.id) ?? 0;
                  const left = toX(era.startYear);
                  const width = Math.max(4, toX(era.endYear + 1) - left);
                  return (
                    <div
                      key={era.id}
                      title={era.name}
                      className="absolute flex items-center overflow-hidden rounded-md px-3 text-sm font-medium text-white/95 shadow-sm"
                      style={{
                        left,
                        width,
                        top: lane * ERA_LANE_HEIGHT + 4,
                        height: ERA_LANE_HEIGHT - 8,
                        background: `linear-gradient(90deg, ${era.colorPrimary}, ${era.colorSecondary})`,
                      }}
                    >
                      <span className="truncate">{era.name}</span>
                    </div>
                  );
                })}
              </div>

              {KIND_ORDER.map((kind, laneIdx) => (
                <div
                  key={kind}
                  className="absolute left-0 w-full border-t border-neutral-900/50 bg-neutral-950/20"
                  style={{
                    top: AXIS_HEIGHT + eraStripHeight + laneIdx * ENTRY_LANE_HEIGHT,
                    height: ENTRY_LANE_HEIGHT,
                  }}
                />
              ))}

              {entries?.map((entry) => {
                const laneIdx = KIND_ORDER.indexOf(entry.kind);
                const Meta = KIND_META[entry.kind];
                const Icon = Meta.icon;
                const top = AXIS_HEIGHT + eraStripHeight + laneIdx * ENTRY_LANE_HEIGHT;
                const x = toX(entryToFractionalYear(entry));
                return (
                  <button
                    key={entry.id}
                    onClick={() => setSelected(entry)}
                    className="absolute flex -translate-x-1/2 flex-col items-center gap-1 rounded-md px-1.5 py-1.5 hover:z-10 hover:bg-neutral-800/80"
                    style={{
                      left: x,
                      top: top + ENTRY_LANE_HEIGHT / 2 - (markerSize / 2 + 14),
                    }}
                    title={`${entry.title} (${formatEntryDateRange(entry)})`}
                  >
                    <span
                      className="flex items-center justify-center rounded-full border border-white/10 shadow-sm"
                      style={{
                        width: markerSize,
                        height: markerSize,
                        background: `${Meta.color}33`,
                      }}
                    >
                      <Icon size={markerSize * 0.45} style={{ color: Meta.color }} />
                    </span>
                    <span
                      className="truncate text-[10px] leading-tight text-neutral-400"
                      style={{ maxWidth: entryLabelMaxWidth }}
                    >
                      {entry.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm overflow-y-auto border-l border-neutral-800 bg-neutral-950 p-5 shadow-2xl">
          <button
            onClick={() => setSelected(null)}
            className="absolute right-4 top-4 text-neutral-500 hover:text-neutral-200"
          >
            <X size={18} />
          </button>
          <span className="rounded bg-neutral-800 px-2 py-0.5 text-xs font-medium text-neutral-300">
            {KIND_META[selected.kind].label.replace(/s$/, "")}
          </span>
          <h2 className="mt-2 text-xl font-semibold text-amber-100">{selected.title}</h2>
          <p className="mt-1 text-sm text-neutral-400">
            {formatEntryDateRange(selected)}
          </p>
          {selected.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selected.imageUrl}
              alt={selected.title}
              className="mt-3 h-48 w-full rounded object-cover bg-neutral-800"
            />
          )}
          {selected.summary && <p className="mt-3 text-sm text-neutral-300">{selected.summary}</p>}
          <Link
            href={selected.kind === "book" && selected.bookId ? `/books/${selected.bookId}` : `/entries/${selected.id}`}
            className="mt-4 inline-block rounded-md bg-amber-700 px-3 py-1.5 text-sm font-medium text-amber-50 hover:bg-amber-600"
          >
            Open full page
          </Link>
        </div>
      )}
    </div>
  );
}
