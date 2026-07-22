export type ConsumptionFormat = "print" | "ebook" | "audiobook";

export const CONSUMPTION_FORMATS: ConsumptionFormat[] = ["print", "ebook", "audiobook"];

export const CONSUMPTION_FORMAT_LABELS: Record<ConsumptionFormat, string> = {
  print: "Print book",
  ebook: "E-reader (Kindle, etc.)",
  audiobook: "Audiobook",
};

export const CONSUMPTION_FORMAT_SHORT: Record<ConsumptionFormat, string> = {
  print: "Print",
  ebook: "E-reader",
  audiobook: "Audiobook",
};

export type BookProgressFields = {
  consumptionFormat?: ConsumptionFormat | null;
  totalPages: number;
  currentPage: number;
  editionTotalPages: number | null;
  totalDurationSeconds: number | null;
  currentPositionSeconds?: number | null;
  wordCount?: number | null;
  wordsPerPage?: number | null;
};

function normalizeFormat(format: ConsumptionFormat | null | undefined): ConsumptionFormat {
  return format ?? "print";
}

export { normalizeFormat };

export function getProgressDenominator(book: BookProgressFields): number {
  switch (normalizeFormat(book.consumptionFormat)) {
    case "ebook":
      return book.editionTotalPages ?? 0;
    case "audiobook":
      return book.totalDurationSeconds ?? 0;
    default:
      return book.totalPages;
  }
}

export function getProgressNumerator(book: BookProgressFields): number {
  if (normalizeFormat(book.consumptionFormat) === "audiobook") {
    return book.currentPositionSeconds ?? 0;
  }
  return book.currentPage;
}

export function getProgressPercent(book: BookProgressFields): number {
  const denom = getProgressDenominator(book);
  if (denom <= 0) return 0;
  return Math.min(100, Math.floor((getProgressNumerator(book) / denom) * 100));
}

export function isProgressComplete(book: BookProgressFields, numerator?: number): boolean {
  const denom = getProgressDenominator(book);
  if (denom <= 0) return false;
  const value = numerator ?? getProgressNumerator(book);
  return value >= denom;
}

export function getBulkJumpThreshold(
  book: BookProgressFields,
  pageThreshold: number,
): number {
  if (normalizeFormat(book.consumptionFormat) === "audiobook") {
    const denom = getProgressDenominator(book);
    if (denom <= 0) return pageThreshold;
    // ~25 percentage points without a session
    return Math.max(Math.floor(denom * 0.25), 60);
  }
  return pageThreshold;
}

export function wordsPerPageForBook(book: BookProgressFields): number | null {
  if (book.wordsPerPage != null) return book.wordsPerPage;
  const pages =
    normalizeFormat(book.consumptionFormat) === "ebook"
      ? book.editionTotalPages
      : book.totalPages;
  if (book.wordCount != null && pages != null && pages > 0) {
    return Math.round(book.wordCount / pages);
  }
  return null;
}

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatProgressLabel(book: BookProgressFields): string {
  const pct = getProgressPercent(book);
  switch (normalizeFormat(book.consumptionFormat)) {
    case "audiobook": {
      const denom = book.totalDurationSeconds ?? 0;
      return `${formatDuration(book.currentPositionSeconds ?? 0)} / ${formatDuration(denom)} (${pct}%)`;
    }
    case "ebook": {
      const denom = book.editionTotalPages ?? 0;
      return `Page ${book.currentPage} / ${denom} (${pct}%)`;
    }
    default:
      return `Page ${book.currentPage} / ${book.totalPages} (${pct}%)`;
  }
}

export function durationToParts(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return { h, m, s };
}

export function partsToDuration(hours: number, minutes: number, seconds = 0): number {
  return hours * 3600 + minutes * 60 + seconds;
}

export type BookStatus = "to_read" | "reading" | "finished";

export function statusPatchFromProgress(
  book: BookProgressFields & { status: BookStatus; startedAt?: Date | null },
  numerator: number,
  fieldPatch: Partial<{
    currentPage: number;
    currentPositionSeconds: number;
  }>,
): {
  currentPage?: number;
  currentPositionSeconds?: number;
  status?: BookStatus;
  startedAt?: Date;
  finishedAt?: Date;
  updatedAt: Date;
} {
  const now = new Date();
  const patch: ReturnType<typeof statusPatchFromProgress> = {
    ...fieldPatch,
    updatedAt: now,
  };

  if (book.status === "to_read" && numerator > 0) {
    patch.status = "reading";
    patch.startedAt = book.startedAt ?? now;
  }
  if (isProgressComplete(book, numerator)) {
    patch.status = "finished";
    patch.finishedAt = now;
  }

  return patch;
}
