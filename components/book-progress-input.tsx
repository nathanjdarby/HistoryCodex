"use client";

import { useEffect, useRef, useState } from "react";
import {
  CONSUMPTION_FORMAT_SHORT,
  durationToParts,
  formatDuration,
  formatProgressLabel,
  getProgressDenominator,
  getProgressNumerator,
  getProgressPercent,
  partsToDuration,
  normalizeFormat,
  type BookProgressFields,
  type ConsumptionFormat,
} from "@/lib/book-progress";

type BookProgressBook = BookProgressFields & { id: number };

export function useBookProgress(book: BookProgressBook) {
  const pct = getProgressPercent(book);
  const label = formatProgressLabel(book);
  const denominator = getProgressDenominator(book);
  const numerator = getProgressNumerator(book);
  return { pct, label, denominator, numerator };
}

export function BookFormatBadge({ format }: { format?: ConsumptionFormat | null }) {
  return (
    <span className="rounded bg-surface-raised px-2 py-0.5 text-xs font-medium text-foreground/80">
      {CONSUMPTION_FORMAT_SHORT[normalizeFormat(format)]}
    </span>
  );
}

export function BookProgressInput({
  book,
  pending,
  error,
  onSave,
}: {
  book: BookProgressBook;
  pending?: boolean;
  error?: string | null;
  onSave: (input: { currentPage?: number; currentPositionSeconds?: number }) => void;
}) {
  const { denominator, numerator } = useBookProgress(book);
  const pageInputRef = useRef<HTMLInputElement>(null);
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("0");
  const [seconds, setSeconds] = useState("0");

  useEffect(() => {
    if (book.consumptionFormat === "audiobook") {
      const parts = durationToParts(book.currentPositionSeconds);
      setHours(String(parts.h));
      setMinutes(String(parts.m));
      setSeconds(String(parts.s));
    }
  }, [book.consumptionFormat, book.currentPositionSeconds]);

  if (book.consumptionFormat === "audiobook") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            currentPositionSeconds: partsToDuration(
              Number(hours) || 0,
              Number(minutes) || 0,
              Number(seconds) || 0,
            ),
          });
        }}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <fieldset className="flex flex-1 flex-col gap-2">
          <legend className="text-sm">Current position</legend>
          <div className="grid max-w-md grid-cols-3 gap-2">
            <label className="flex flex-col gap-1 text-xs text-muted">
              Hours
              <input
                type="number"
                min={0}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="rounded border border-border-strong bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted">
              Minutes
              <input
                type="number"
                min={0}
                max={59}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="rounded border border-border-strong bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted">
              Seconds
              <input
                type="number"
                min={0}
                max={59}
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
                className="rounded border border-border-strong bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
          </div>
          <p className="text-xs text-muted">
            Total runtime: {formatDuration(denominator)}
          </p>
        </fieldset>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:brightness-110 disabled:opacity-50 sm:shrink-0"
        >
          {pending ? "Saving…" : "Save progress"}
        </button>
        {error && <p className="w-full text-sm text-red-400">{error}</p>}
      </form>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const value = Number(pageInputRef.current?.value ?? 0);
        onSave({ currentPage: value });
      }}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <label className="flex flex-1 flex-col gap-1 text-sm">
        {book.consumptionFormat === "ebook" ? "Current page (your edition)" : "Update current page"}
        <input
          key={numerator}
          ref={pageInputRef}
          type="number"
          min={0}
          max={denominator}
          defaultValue={numerator}
          className="max-w-xs rounded border border-border-strong bg-background px-3 py-2"
        />
        {book.consumptionFormat === "ebook" && (
          <span className="text-xs text-muted">
            Your edition: {book.editionTotalPages} pages (print reference: {book.totalPages})
          </span>
        )}
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:brightness-110 disabled:opacity-50 sm:shrink-0"
      >
        {pending ? "Saving…" : "Save progress"}
      </button>
      {error && <p className="w-full text-sm text-red-400">{error}</p>}
    </form>
  );
}

export function BookSettingsPanel({
  book,
  pending,
  onSave,
}: {
  book: BookProgressBook;
  pending?: boolean;
  onSave: (input: {
    consumptionFormat?: ConsumptionFormat;
    editionTotalPages?: number;
    totalDurationSeconds?: number;
  }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ConsumptionFormat>(book.consumptionFormat);
  const [editionPages, setEditionPages] = useState(String(book.editionTotalPages ?? book.totalPages));
  const [runtimeHours, setRuntimeHours] = useState("0");
  const [runtimeMinutes, setRuntimeMinutes] = useState("0");

  useEffect(() => {
    setFormat(book.consumptionFormat);
    setEditionPages(String(book.editionTotalPages ?? book.totalPages));
    if (book.totalDurationSeconds) {
      const parts = durationToParts(book.totalDurationSeconds);
      setRuntimeHours(String(parts.h));
      setRuntimeMinutes(String(parts.m));
    }
  }, [book]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-muted underline-offset-2 hover:text-foreground hover:underline"
      >
        Change version or edition details
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const input: {
          consumptionFormat: ConsumptionFormat;
          editionTotalPages?: number;
          totalDurationSeconds?: number;
        } = { consumptionFormat: format };
        if (format === "ebook") {
          input.editionTotalPages = Number(editionPages);
        }
        if (format === "audiobook") {
          input.totalDurationSeconds = partsToDuration(
            Number(runtimeHours) || 0,
            Number(runtimeMinutes) || 0,
          );
        }
        onSave(input);
        setOpen(false);
      }}
      className="mt-3 space-y-3 rounded-lg border border-border/80 bg-background/40 p-4"
    >
      <p className="text-xs text-muted">
        Changing version resets your logged progress. Milestones you already earned are kept.
      </p>
      <label className="flex flex-col gap-1 text-sm">
        Version
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value as ConsumptionFormat)}
          className="app-input max-w-xs py-2"
        >
          <option value="print">Print book</option>
          <option value="ebook">E-reader (Kindle, etc.)</option>
          <option value="audiobook">Audiobook</option>
        </select>
      </label>
      {format === "ebook" && (
        <label className="flex flex-col gap-1 text-sm">
          Pages in your edition
          <input
            type="number"
            min={1}
            required
            value={editionPages}
            onChange={(e) => setEditionPages(e.target.value)}
            className="app-input max-w-xs py-2"
          />
        </label>
      )}
      {format === "audiobook" && (
        <div className="grid max-w-xs grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Hours
            <input
              type="number"
              min={0}
              value={runtimeHours}
              onChange={(e) => setRuntimeHours(e.target.value)}
              className="app-input py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Minutes
            <input
              type="number"
              min={0}
              max={59}
              value={runtimeMinutes}
              onChange={(e) => setRuntimeMinutes(e.target.value)}
              className="app-input py-2"
            />
          </label>
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-border-strong px-3 py-1.5 text-sm text-muted"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
