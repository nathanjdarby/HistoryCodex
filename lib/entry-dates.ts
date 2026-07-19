import { formatYear, formatYearMonth } from "@/lib/format";
import type { TimelineEntry } from "@/lib/types";

export type DatePrecision = "year" | "month" | "day";

export type EntryDateFormValue = {
  precision: DatePrecision;
  year: string;
  month: string;
  day: string;
  hasEnd: boolean;
  yearEnd: string;
  monthEnd: string;
  dayEnd: string;
};

export type EntryDateParts = {
  year: number;
  month: number | null;
  day: number | null;
};

export type EntryDatePayload = EntryDateParts & {
  yearEnd: number | null;
  monthEnd: number | null;
  dayEnd: number | null;
};

export const MONTH_OPTIONS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
] as const;

export function emptyEntryDateForm(): EntryDateFormValue {
  return {
    precision: "year",
    year: "",
    month: "1",
    day: "1",
    hasEnd: false,
    yearEnd: "",
    monthEnd: "1",
    dayEnd: "1",
  };
}

export function inferPrecision(
  month: number | null | undefined,
  day: number | null | undefined,
): DatePrecision {
  if (day != null) return "day";
  if (month != null) return "month";
  return "year";
}

export function daysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12) return 31;
  if (year > 0 && year < 10000) {
    return new Date(year, month, 0).getDate();
  }
  if (month === 2) return 28;
  if ([4, 6, 9, 11].includes(month)) return 30;
  return 31;
}

export function validateDateParts(
  year: number,
  month: number | null,
  day: number | null,
): string | null {
  if (month != null && (month < 1 || month > 12)) return "Month must be between 1 and 12";
  if (day != null && month == null) return "Select a month when specifying a day";
  if (day != null && month != null) {
    const maxDay = daysInMonth(year, month);
    if (day < 1 || day > maxDay) return `Day must be between 1 and ${maxDay} for that month`;
  }
  return null;
}

export function datePartsToFractionalYear(
  year: number,
  month: number | null,
  day: number | null,
): number {
  if (month == null) return year + 0.5;
  if (day == null) return year + (month - 0.5) / 12;
  const dim = daysInMonth(year, month);
  return year + (month - 1 + (day - 0.5) / dim) / 12;
}

export function entryFractionalStart(
  entry: Pick<TimelineEntry, "year" | "month" | "day">,
): number {
  return datePartsToFractionalYear(entry.year, entry.month, entry.day);
}

export function entryFractionalEnd(
  entry: Pick<TimelineEntry, "year" | "month" | "day" | "yearEnd" | "monthEnd" | "dayEnd">,
): number {
  const endYear = entry.yearEnd ?? entry.year;
  return datePartsToFractionalYear(endYear, entry.monthEnd, entry.dayEnd);
}

export function entryToFractionalYear(
  entry: Pick<TimelineEntry, "year" | "month" | "day" | "yearEnd" | "monthEnd" | "dayEnd">,
): number {
  const start = entryFractionalStart(entry);
  if (entry.yearEnd == null) return start;
  const end = entryFractionalEnd(entry);
  if (end === start) return start;
  return (start + end) / 2;
}

export function validateDateRange(payload: EntryDatePayload): string | null {
  const startErr = validateDateParts(payload.year, payload.month, payload.day);
  if (startErr) return startErr;

  if (payload.yearEnd == null) return null;

  const endErr = validateDateParts(payload.yearEnd, payload.monthEnd, payload.dayEnd);
  if (endErr) return `End date: ${endErr}`;

  const start = datePartsToFractionalYear(payload.year, payload.month, payload.day);
  const end = datePartsToFractionalYear(payload.yearEnd, payload.monthEnd, payload.dayEnd);
  if (end < start) return "End date must be on or after the start date";

  return null;
}

export function entryDateFormFromEntry(
  entry: Pick<
    TimelineEntry,
    "year" | "month" | "day" | "yearEnd" | "monthEnd" | "dayEnd"
  >,
): EntryDateFormValue {
  const precision = inferPrecision(entry.month, entry.day);
  return {
    precision,
    year: String(entry.year),
    month: entry.month != null ? String(entry.month) : "1",
    day: entry.day != null ? String(entry.day) : "1",
    hasEnd: entry.yearEnd != null,
    yearEnd: entry.yearEnd != null ? String(entry.yearEnd) : "",
    monthEnd:
      entry.monthEnd != null
        ? String(entry.monthEnd)
        : entry.month != null
          ? String(entry.month)
          : "1",
    dayEnd:
      entry.dayEnd != null ? String(entry.dayEnd) : entry.day != null ? String(entry.day) : "1",
  };
}

function parseYear(value: string): number | null {
  if (value.trim() === "") return null;
  const year = Number(value);
  if (!Number.isInteger(year)) return null;
  return year;
}

function parseMonthDay(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  if (!Number.isInteger(n)) return null;
  return n;
}

export function entryDateFormToPayload(
  form: EntryDateFormValue,
): EntryDatePayload | { error: string } {
  const year = parseYear(form.year);
  if (year == null) return { error: "Year is required" };

  let month: number | null = null;
  let day: number | null = null;

  if (form.precision === "month" || form.precision === "day") {
    month = parseMonthDay(form.month);
    if (month == null) return { error: "Month is required" };
  }
  if (form.precision === "day") {
    day = parseMonthDay(form.day);
    if (day == null) return { error: "Day is required" };
  }

  let yearEnd: number | null = null;
  let monthEnd: number | null = null;
  let dayEnd: number | null = null;

  if (form.hasEnd) {
    yearEnd = parseYear(form.yearEnd);
    if (yearEnd == null) return { error: "End year is required when using a date range" };

    if (form.precision === "month" || form.precision === "day") {
      monthEnd = parseMonthDay(form.monthEnd);
      if (monthEnd == null) return { error: "End month is required" };
    }
    if (form.precision === "day") {
      dayEnd = parseMonthDay(form.dayEnd);
      if (dayEnd == null) return { error: "End day is required" };
    }
  }

  const payload: EntryDatePayload = { year, month, day, yearEnd, monthEnd, dayEnd };
  const rangeErr = validateDateRange(payload);
  if (rangeErr) return { error: rangeErr };

  return payload;
}

export function formatEntryDateParts(parts: EntryDateParts): string {
  if (parts.month == null) return formatYear(parts.year);
  if (parts.day == null) return formatYearMonth(parts.year, parts.month);
  const monthLabel = MONTH_OPTIONS[parts.month - 1]?.label.slice(0, 3) ?? String(parts.month);
  return `${parts.day} ${monthLabel} ${formatYear(parts.year)}`;
}

export function formatEntryDateRange(
  entry: Pick<TimelineEntry, "year" | "month" | "day" | "yearEnd" | "monthEnd" | "dayEnd">,
): string {
  const start = formatEntryDateParts({
    year: entry.year,
    month: entry.month,
    day: entry.day,
  });

  if (entry.yearEnd == null) return start;

  const end = formatEntryDateParts({
    year: entry.yearEnd,
    month: entry.monthEnd,
    day: entry.dayEnd,
  });

  if (start === end) return start;
  return `${start} – ${end}`;
}
