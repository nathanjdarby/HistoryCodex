"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { BookOpen, Loader2 } from "lucide-react";
import {
  CONSUMPTION_FORMAT_LABELS,
  partsToDuration,
  type ConsumptionFormat,
} from "@/lib/book-progress";

type CatalogBookForAdd = {
  id: number;
  title: string;
  author: string | null;
  coverUrl: string | null;
  totalPages: number;
};

type AddBookInput = {
  catalogBookId: number;
  consumptionFormat: ConsumptionFormat;
  editionTotalPages?: number;
  totalDurationSeconds?: number;
};

export function AddBookDialog({
  book,
  open,
  pending,
  error,
  onConfirm,
  onCancel,
}: {
  book: CatalogBookForAdd | null;
  open: boolean;
  pending?: boolean;
  error?: string | null;
  onConfirm: (input: AddBookInput) => void;
  onCancel: () => void;
}) {
  const [format, setFormat] = useState<ConsumptionFormat>("print");
  const [editionPages, setEditionPages] = useState("");
  const [runtimeHours, setRuntimeHours] = useState("");
  const [runtimeMinutes, setRuntimeMinutes] = useState("");

  useEffect(() => {
    if (!open || !book) return;
    setFormat("print");
    setEditionPages(String(book.totalPages));
    setRuntimeHours("");
    setRuntimeMinutes("");
  }, [open, book]);

  if (!open || !book) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input: AddBookInput = {
      catalogBookId: book.id,
      consumptionFormat: format,
    };
    if (format === "ebook") {
      input.editionTotalPages = Number(editionPages);
    }
    if (format === "audiobook") {
      input.totalDurationSeconds = partsToDuration(
        Number(runtimeHours) || 0,
        Number(runtimeMinutes) || 0,
      );
    }
    onConfirm(input);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-book-title"
      >
        <div className="flex gap-4">
          <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded bg-surface-raised">
            {book.coverUrl ? (
              <Image src={book.coverUrl} alt="" fill sizes="64px" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-subtle">
                <BookOpen size={20} />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h2 id="add-book-title" className="text-base font-semibold text-foreground">
              Add to library
            </h2>
            <p className="mt-1 line-clamp-2 text-sm text-muted">{book.title}</p>
            {book.author && (
              <p className="text-xs text-muted">by {book.author}</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="flex flex-col gap-1.5 text-sm">
            Which version are you reading?
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as ConsumptionFormat)}
              className="app-input w-full py-2"
            >
              {(Object.entries(CONSUMPTION_FORMAT_LABELS) as [ConsumptionFormat, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </label>

          {format === "ebook" && (
            <label className="flex flex-col gap-1.5 text-sm">
              Pages in your edition
              <input
                type="number"
                min={1}
                required
                value={editionPages}
                onChange={(e) => setEditionPages(e.target.value)}
                className="app-input w-full py-2"
              />
              <span className="text-xs text-muted">
                Print edition is ~{book.totalPages} pages — enter what your device shows.
              </span>
            </label>
          )}

          {format === "audiobook" && (
            <fieldset className="space-y-3">
              <legend className="text-sm">Total runtime</legend>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  Hours
                  <input
                    type="number"
                    min={0}
                    value={runtimeHours}
                    onChange={(e) => setRuntimeHours(e.target.value)}
                    className="app-input w-full py-2"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Minutes
                  <input
                    type="number"
                    min={0}
                    max={59}
                    required={!runtimeHours}
                    value={runtimeMinutes}
                    onChange={(e) => setRuntimeMinutes(e.target.value)}
                    className="app-input w-full py-2"
                  />
                </label>
              </div>
              <p className="text-xs text-muted">
                Check your audiobook app for the total length.
              </p>
            </fieldset>
          )}

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              className="rounded-md border border-border-strong px-3 py-1.5 text-sm text-foreground/80 hover:bg-surface-raised disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="app-btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
            >
              {pending && <Loader2 size={14} className="animate-spin" />}
              Add to library
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
