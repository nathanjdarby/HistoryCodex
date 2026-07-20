"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { BookOpen, Calendar, Layers, ScrollText, StickyNote, User, X, Plus } from "lucide-react";
import type { Era, TimelineEntry } from "@/lib/types";
import { formatYear } from "@/lib/format";
import { entryFractionalEnd, entryFractionalStart, formatEntryDateRange } from "@/lib/entry-dates";
import {
  assignEraLanes,
  assignTimeRangeLanes,
  fractionalYearToY,
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

const AXIS_WIDTH = 80;
const HEADER_HEIGHT = 44;
const ERA_COLUMN_WIDTH = 220;
const ENTRY_COLUMN_WIDTH = 200;
const ERA_LANE_GAP = 4;
const MIN_SLOT_HEIGHT = 56;
const PADDING_YEARS = 30;
const DEFAULT_FLOOR_YEAR = -3000;

function entrySpan(entry: TimelineEntry) {
  const start = entryFractionalStart(entry);
  const end = entry.yearEnd != null ? entryFractionalEnd(entry) : start;
  return { start, end: Math.max(start, end) };
}

export default function TimelinePage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialScrollDone = useRef(false);
  const { data: eras, isFetched: erasFetched } = useQuery({ queryKey: ["eras"], queryFn: fetchEras });
  const { data: entries, isFetched: entriesFetched } = useQuery({
    queryKey: ["entries"],
    queryFn: fetchEntries,
  });
  const [zoomIdx, setZoomIdx] = useState(2);
  const [jumpEraId, setJumpEraId] = useState("");
  const [selected, setSelected] = useState<TimelineEntry | null>(null);

  const zoom = ZOOM_LEVELS[zoomIdx];
  const pxPerYear = zoom.pxPerYear;
  const currentYear = new Date().getFullYear();
  const hasTimelines = (eras?.length ?? 0) > 0;

  const { minYear, maxYear, laneOf, eraLaneCount, firstEra } = useMemo(() => {
    const eraList = eras ?? [];
    const entryList = entries ?? [];
    let min: number;
    let max: number;

    if (eraList.length > 0) {
      min = Math.min(...eraList.map((era) => era.startYear));
      max = Math.max(...eraList.map((era) => era.endYear));
    } else {
      min = DEFAULT_FLOOR_YEAR;
      max = currentYear;
    }

    for (const entry of entryList) {
      const { start, end } = entrySpan(entry);
      min = Math.min(min, start);
      max = Math.max(max, end);
    }
    const laneOf = assignEraLanes(eraList);
    const eraLaneCount = Math.max(1, laneOf.size ? Math.max(...laneOf.values()) + 1 : 1);
    const firstEra = eraList.length > 0 ? [...eraList].sort((a, b) => a.startYear - b.startYear)[0]! : null;
    return {
      minYear: min - PADDING_YEARS,
      maxYear: max + PADDING_YEARS,
      laneOf,
      eraLaneCount,
      firstEra,
    };
  }, [eras, entries, currentYear]);

  const toY = (fractionalYear: number) => fractionalYearToY(fractionalYear, minYear, pxPerYear);
  const totalHeight = Math.max(800, toY(maxYear + 1));
  const totalWidth = AXIS_WIDTH + ERA_COLUMN_WIDTH + KIND_ORDER.length * ENTRY_COLUMN_WIDTH;

  const yearGrid = useMemo(() => {
    const step = niceYearStep(pxPerYear);
    return gridlineYears(minYear, maxYear, step);
  }, [minYear, maxYear, pxPerYear]);

  const monthGrid = useMemo(() => {
    if (zoom.granularity !== "month") return [];
    return gridlineMonths(minYear, maxYear, pxPerYear);
  }, [zoom.granularity, minYear, maxYear, pxPerYear]);

  const entryLanesByKind = useMemo(() => {
    const byKind = new Map<TimelineEntry["kind"], Map<number, { lane: number; laneCount: number }>>();
    for (const kind of KIND_ORDER) {
      const kindEntries = (entries ?? []).filter((entry) => entry.kind === kind);
      const spans = kindEntries.map((entry) => {
        const { start, end } = entrySpan(entry);
        return { id: entry.id, start, end: end + 0.001 };
      });
      byKind.set(kind, assignTimeRangeLanes(spans));
    }
    return byKind;
  }, [entries]);

  const scrollToYear = useCallback(
    (year: number, behavior: ScrollBehavior = "smooth") => {
      const el = scrollRef.current;
      if (!el) return;
      const top = Math.max(0, fractionalYearToY(year, minYear, pxPerYear) - 80);
      el.scrollTo({ top, behavior });
    },
    [minYear, pxPerYear],
  );

  useEffect(() => {
    if (initialScrollDone.current || !erasFetched || !entriesFetched || !firstEra) return;

    initialScrollDone.current = true;
    requestAnimationFrame(() => {
      scrollToYear(firstEra.startYear, "auto");
    });
  }, [erasFetched, entriesFetched, firstEra, scrollToYear]);

  function jumpToEra(eraId: string) {
    const era = eras?.find((e) => String(e.id) === eraId);
    if (!era) return;
    requestAnimationFrame(() => scrollToYear(era.startYear, "smooth"));
  }

  return (
    <div className="flex min-h-[calc(100dvh-9rem)] flex-col gap-4">
      <PageHeader
        eyebrow="History"
        title="Timeline"
        description="Scroll vertically through history. Each column is a lane — eras and entries sit in calendar-style time slots."
        icon={ScrollText}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/profile/timelines" className="app-btn-secondary">
              <Layers size={14} />
              My timelines
            </Link>
            <select
              value={jumpEraId}
              onChange={(e) => {
                const eraId = e.target.value;
                setJumpEraId(eraId);
                if (eraId) jumpToEra(eraId);
              }}
              disabled={!hasTimelines}
              className="app-input py-1.5 disabled:opacity-50"
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
            <div className="app-segment">
              {ZOOM_LEVELS.map((level, i) => (
                <button
                  key={level.label}
                  onClick={() => setZoomIdx(i)}
                  className={i === zoomIdx ? "app-segment-active" : "app-segment-inactive"}
                >
                  {level.label}
                </button>
              ))}
            </div>
            <Link href="/entries/new" className="app-btn-primary">
              <Plus size={14} />
              Entry
            </Link>
          </div>
        }
      />

      {!hasTimelines && (
        <div className="app-empty">
          <p className="text-foreground">You haven&apos;t added any timelines to your profile yet.</p>
          <p className="mt-1 text-sm">
            Pick the historical periods you want to explore — British, Roman, medieval, or anything
            else in the catalog.
          </p>
          <Link href="/profile/timelines" className="app-btn-primary mt-4 inline-flex items-center gap-1.5">
            <Layers size={15} />
            Choose my timelines
          </Link>
        </div>
      )}

      {hasTimelines && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-lg">
          {/* Sticky column headers */}
          <div
            className="flex shrink-0 border-b border-border bg-background/95 backdrop-blur-sm"
            style={{ height: HEADER_HEIGHT }}
          >
            <div
              className="sticky left-0 z-30 shrink-0 border-r border-border bg-background/95"
              style={{ width: AXIS_WIDTH }}
            />
            <div className="flex min-w-0 flex-1 overflow-hidden">
              <div
                className="flex shrink-0 items-center justify-center border-r border-border px-3 text-[11px] font-semibold uppercase tracking-wide text-muted"
                style={{ width: ERA_COLUMN_WIDTH }}
              >
                Eras
              </div>
              {KIND_ORDER.map((kind) => {
                const Meta = KIND_META[kind];
                const Icon = Meta.icon;
                return (
                  <div
                    key={kind}
                    className="flex shrink-0 items-center gap-2 border-r border-border px-3 text-sm font-medium text-foreground/80 last:border-r-0"
                    style={{ width: ENTRY_COLUMN_WIDTH }}
                  >
                    <Icon size={15} style={{ color: Meta.color }} />
                    {Meta.label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scrollable timeline body */}
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto">
            <div className="relative flex" style={{ width: totalWidth, height: totalHeight }}>
              {/* Time axis — sticky left */}
              <div
                className="sticky left-0 z-20 shrink-0 border-r border-border bg-background/95"
                style={{ width: AXIS_WIDTH, height: totalHeight }}
              >
                {zoom.granularity === "month"
                  ? monthGrid.map(({ year, month, label, major }) => {
                      const y = toY(year + (month - 1) / 12);
                      if (!label) return null;
                      return (
                        <div
                          key={`${year}-${month}`}
                          className="absolute right-0 flex w-full items-start justify-end pr-2"
                          style={{ top: y, transform: "translateY(-0.5em)" }}
                        >
                          <span
                            className={`whitespace-nowrap text-right ${
                              major ? "text-[11px] font-medium text-muted" : "text-[10px] text-subtle"
                            }`}
                          >
                            {label}
                          </span>
                        </div>
                      );
                    })
                  : yearGrid.map((year) => (
                      <div
                        key={year}
                        className="absolute right-0 flex w-full items-start justify-end pr-2"
                        style={{ top: toY(year), transform: "translateY(-0.5em)" }}
                      >
                        <span className="whitespace-nowrap text-right text-[11px] font-medium text-muted">
                          {formatYear(year)}
                        </span>
                      </div>
                    ))}
              </div>

              {/* Content columns */}
              <div className="relative flex shrink-0" style={{ height: totalHeight }}>
                {/* Horizontal gridlines */}
                <div className="pointer-events-none absolute inset-0">
                  {zoom.granularity === "month"
                    ? monthGrid.map(({ year, month, major }) => (
                        <div
                          key={`${year}-${month}`}
                          className={`absolute left-0 right-0 h-px ${major ? "bg-surface-raised" : "bg-surface/80"}`}
                          style={{ top: toY(year + (month - 1) / 12) }}
                        />
                      ))
                    : yearGrid.map((year) => (
                        <div
                          key={year}
                          className="absolute left-0 right-0 h-px bg-surface-raised"
                          style={{ top: toY(year) }}
                        />
                      ))}
                </div>

                {/* Eras column */}
                <div
                  className="relative shrink-0 border-r border-border/60 bg-background/20"
                  style={{ width: ERA_COLUMN_WIDTH, height: totalHeight }}
                >
                  {eras?.map((era) => {
                    const lane = laneOf.get(era.id) ?? 0;
                    const laneWidth =
                      (ERA_COLUMN_WIDTH - ERA_LANE_GAP * (eraLaneCount + 1)) / eraLaneCount;
                    const top = toY(era.startYear);
                    const height = Math.max(8, toY(era.endYear + 1) - top);
                    return (
                      <div
                        key={era.id}
                        title={`${era.name} (${formatYear(era.startYear)} – ${formatYear(era.endYear)})`}
                        className="absolute overflow-hidden rounded-md px-2 py-2 text-xs font-medium leading-snug text-white/95 shadow-sm"
                        style={{
                          top,
                          height,
                          left: ERA_LANE_GAP + lane * (laneWidth + ERA_LANE_GAP),
                          width: laneWidth,
                          background: `linear-gradient(180deg, ${era.colorPrimary}, ${era.colorSecondary})`,
                        }}
                      >
                        <span className="line-clamp-[12]">{era.name}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Entry columns */}
                {KIND_ORDER.map((kind) => {
                  const Meta = KIND_META[kind];
                  const Icon = Meta.icon;
                  const laneMap = entryLanesByKind.get(kind) ?? new Map();
                  const kindEntries = (entries ?? []).filter((entry) => entry.kind === kind);

                  return (
                    <div
                      key={kind}
                      className="relative shrink-0 border-r border-border/60 bg-background/10 last:border-r-0"
                      style={{ width: ENTRY_COLUMN_WIDTH, height: totalHeight }}
                    >
                      {kindEntries.map((entry) => {
                        const { start, end } = entrySpan(entry);
                        const laneInfo = laneMap.get(entry.id) ?? { lane: 0, laneCount: 1 };
                        const slotGap = 4;
                        const slotWidth =
                          (ENTRY_COLUMN_WIDTH - slotGap * (laneInfo.laneCount + 1)) /
                          laneInfo.laneCount;
                        const top = toY(start);
                        const rawHeight = toY(end + (entry.yearEnd != null ? 1 : 0)) - top;
                        const height = Math.max(MIN_SLOT_HEIGHT, rawHeight);

                        return (
                          <button
                            key={entry.id}
                            onClick={() => setSelected(entry)}
                            className="absolute overflow-hidden rounded-md border border-white/10 px-2 py-1.5 text-left shadow-sm transition hover:z-10 hover:brightness-110"
                            style={{
                              top,
                              height,
                              left: slotGap + laneInfo.lane * (slotWidth + slotGap),
                              width: slotWidth,
                              background: `linear-gradient(135deg, ${Meta.color}22, ${Meta.color}08)`,
                              borderLeftColor: Meta.color,
                              borderLeftWidth: 3,
                            }}
                            title={`${entry.title} (${formatEntryDateRange(entry)})`}
                          >
                            <div className="flex items-start gap-1.5">
                              <Icon
                                size={13}
                                className="mt-0.5 shrink-0"
                                style={{ color: Meta.color }}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-foreground">
                                  {entry.title}
                                </p>
                                <p className="mt-0.5 truncate text-[10px] text-muted">
                                  {formatEntryDateRange(entry)}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm overflow-y-auto border-l border-border bg-background p-5 shadow-2xl">
          <button
            onClick={() => setSelected(null)}
            className="absolute right-4 top-4 text-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
          <span className="rounded bg-surface-raised px-2 py-0.5 text-xs font-medium text-foreground/80">
            {KIND_META[selected.kind].label.replace(/s$/, "")}
          </span>
          <h2 className="mt-2 text-xl font-semibold text-foreground">{selected.title}</h2>
          <p className="mt-1 text-sm text-muted">{formatEntryDateRange(selected)}</p>
          {selected.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selected.imageUrl}
              alt={selected.title}
              className="mt-3 h-48 w-full rounded object-cover bg-surface-raised"
            />
          )}
          {selected.summary && <p className="mt-3 text-sm text-foreground/80">{selected.summary}</p>}
          <Link
            href={
              selected.kind === "book" && selected.bookId
                ? `/books/${selected.bookId}`
                : `/entries/${selected.id}`
            }
            className="mt-4 inline-block rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:brightness-110"
          >
            Open full page
          </Link>
        </div>
      )}
    </div>
  );
}
