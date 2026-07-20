import type { Era } from "@/lib/types";

export function assignEraLanes(eras: Era[]): Map<number, number> {
  const sorted = [...eras].sort((a, b) => a.startYear - b.startYear);
  const laneEnds: number[] = [];
  const laneOf = new Map<number, number>();
  for (const era of sorted) {
    let placed = false;
    for (let i = 0; i < laneEnds.length; i++) {
      if (era.startYear >= laneEnds[i]) {
        laneEnds[i] = era.endYear;
        laneOf.set(era.id, i);
        placed = true;
        break;
      }
    }
    if (!placed) {
      laneEnds.push(era.endYear);
      laneOf.set(era.id, laneEnds.length - 1);
    }
  }
  return laneOf;
}

export function yearToFractionalYear(year: number, month = 1): number {
  return year + (Math.min(12, Math.max(1, month)) - 1) / 12;
}

export { entryFractionalEnd, entryFractionalStart, entryToFractionalYear } from "@/lib/entry-dates";

export function fractionalYearToX(
  fractionalYear: number,
  minYear: number,
  pxPerYear: number,
): number {
  return (fractionalYear - minYear) * pxPerYear;
}

/** Same scale as {@link fractionalYearToX} — usable for vertical timelines. */
export function fractionalYearToY(
  fractionalYear: number,
  minYear: number,
  pxPerYear: number,
): number {
  return fractionalYearToX(fractionalYear, minYear, pxPerYear);
}

export function yearToX(year: number, minYear: number, pxPerYear: number): number {
  return fractionalYearToX(year, minYear, pxPerYear);
}

export type TimeRangeLane = { lane: number; laneCount: number };

/** Stack overlapping time ranges side-by-side within a column (calendar-style). */
export function assignTimeRangeLanes(
  items: { id: number; start: number; end: number }[],
): Map<number, TimeRangeLane> {
  const sorted = [...items].sort((a, b) => a.start - b.start || a.end - b.end);
  const laneEnds: number[] = [];
  const laneOf = new Map<number, number>();

  for (const item of sorted) {
    let placed = false;
    for (let i = 0; i < laneEnds.length; i++) {
      if (item.start >= laneEnds[i]) {
        laneEnds[i] = item.end;
        laneOf.set(item.id, i);
        placed = true;
        break;
      }
    }
    if (!placed) {
      laneEnds.push(item.end);
      laneOf.set(item.id, laneEnds.length - 1);
    }
  }

  const laneCount = Math.max(1, laneEnds.length);
  const result = new Map<number, TimeRangeLane>();
  for (const [id, lane] of laneOf) {
    result.set(id, { lane, laneCount });
  }
  return result;
}

export function niceYearStep(pxPerYear: number, minPxBetweenLabels = 110): number {
  const rawStep = minPxBetweenLabels / pxPerYear;
  const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(rawStep, 1))));
  const residual = rawStep / magnitude;
  let niceResidual: number;
  if (residual > 5) niceResidual = 10;
  else if (residual > 2) niceResidual = 5;
  else if (residual > 1) niceResidual = 2;
  else niceResidual = 1;
  return niceResidual * magnitude;
}

export function gridlineYears(minYear: number, maxYear: number, step: number): number[] {
  const start = Math.ceil(minYear / step) * step;
  const years: number[] = [];
  for (let y = start; y <= maxYear; y += step) {
    years.push(y);
  }
  return years;
}

export type MonthGridline = {
  year: number;
  month: number;
  label: string | null;
  major: boolean;
};

export function gridlineMonths(
  minYear: number,
  maxYear: number,
  pxPerYear: number,
  minPxBetweenLabels = 64,
): MonthGridline[] {
  const monthPx = pxPerYear / 12;
  let labelEvery = 1;
  if (monthPx * labelEvery < minPxBetweenLabels) {
    if (monthPx * 3 >= minPxBetweenLabels) labelEvery = 3;
    else if (monthPx * 6 >= minPxBetweenLabels) labelEvery = 6;
    else labelEvery = 12;
  }

  const MONTH_SHORT = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const lines: MonthGridline[] = [];
  for (let year = minYear; year <= maxYear; year++) {
    for (let month = 1; month <= 12; month++) {
      const major = month === 1;
      let label: string | null = null;
      if (major) {
        label = year < 0 ? `${Math.abs(year)} BCE` : `${year}`;
      } else if ((month - 1) % labelEvery === 0) {
        label = MONTH_SHORT[month - 1];
      }
      lines.push({ year, month, label, major });
    }
  }
  return lines;
}
