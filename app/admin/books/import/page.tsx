"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FolderInput, FolderOpen, Upload } from "lucide-react";
import type { Era } from "@/lib/types";
import {
  filesFromDirectoryInput,
  pickImportFolderWithDirectoryPicker,
  uploadImportFolder,
} from "@/lib/client/import-folder-picker";
import type {
  ImportCardPreview,
  ImportCatalogBookCardsResult,
  ImportDuplicateDecision,
} from "@/lib/server/import-catalog-book-cards";
import { ImportDuplicateCardReview } from "@/components/import-duplicate-card-review";

type CatalogBook = {
  id: number;
  title: string;
  eraId: number | null;
  eraName: string | null;
};

type ImportFormState = {
  dir: string;
  bookId: string;
  eraSlug: string;
  bookTitle: string;
  createBook: boolean;
  mergeLinks: boolean;
  multiEra: boolean;
};

async function fetchEras(): Promise<Era[]> {
  const res = await fetch("/api/eras");
  if (!res.ok) throw new Error("Failed to load eras");
  return res.json();
}

async function fetchCatalogBooks(): Promise<CatalogBook[]> {
  const res = await fetch("/api/admin/catalog-books");
  if (!res.ok) throw new Error("Failed to load catalog books");
  return res.json();
}

function ImportBookCardsPageInner() {
  const searchParams = useSearchParams();
  const initialBookId = searchParams.get("bookId") ?? "";

  const { data: eras } = useQuery({ queryKey: ["eras"], queryFn: fetchEras });
  const { data: catalogBooks } = useQuery({
    queryKey: ["admin-catalog-books"],
    queryFn: fetchCatalogBooks,
  });

  const [form, setForm] = useState<ImportFormState>({
    dir: "",
    bookId: initialBookId,
    eraSlug: "",
    bookTitle: "",
    createBook: true,
    mergeLinks: false,
    multiEra: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportCatalogBookCardsResult | null>(null);
  const [pendingDuplicates, setPendingDuplicates] = useState<ImportCardPreview[]>([]);
  const [pendingNewCards, setPendingNewCards] = useState<ImportCardPreview[]>([]);
  const [duplicateDecisions, setDuplicateDecisions] = useState<
    Record<string, ImportDuplicateDecision>
  >({});
  const [selectedFolderLabel, setSelectedFolderLabel] = useState<string | null>(null);
  const [stagingFolder, setStagingFolder] = useState(false);
  const [stagingProgress, setStagingProgress] = useState<string | null>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const selectedBook = useMemo(
    () => (catalogBooks ?? []).find((book) => String(book.id) === form.bookId) ?? null,
    [catalogBooks, form.bookId],
  );

  const eraLockedToBook = selectedBook?.eraId != null && !form.multiEra;

  useEffect(() => {
    if (!selectedBook) return;
    if (!selectedBook.eraId) {
      setForm((current) => ({ ...current, multiEra: true, createBook: false }));
      return;
    }
    if (!eras) return;
    const era = eras.find((entry) => entry.id === selectedBook.eraId);
    if (!era) return;
    setForm((current) => ({
      ...current,
      eraSlug: era.slug,
      bookTitle: current.bookTitle || selectedBook.title,
      createBook: false,
    }));
  }, [selectedBook, eras]);

  const hasTarget = Boolean(form.bookId) || Boolean(form.eraSlug);
  const canRun = Boolean(
    form.dir.trim() &&
      hasTarget &&
      !stagingFolder &&
      (form.multiEra || selectedBook?.eraId != null || Boolean(form.eraSlug)),
  );

  function buildPayload(params?: {
    dryRun?: boolean;
    decisions?: Record<string, ImportDuplicateDecision>;
  }) {
    return {
      dir: form.dir.trim(),
      bookId: form.bookId ? Number(form.bookId) : undefined,
      eraSlug: eraLockedToBook ? undefined : form.eraSlug || undefined,
      bookTitle: form.bookId ? undefined : form.bookTitle.trim() || undefined,
      createBook: form.bookId ? false : form.createBook,
      mergeLinks: form.mergeLinks,
      multiEra: form.multiEra,
      dryRun: params?.dryRun ?? false,
      duplicateDecisions: params?.decisions,
    };
  }

  async function runImport(params?: {
    dryRun?: boolean;
    decisions?: Record<string, ImportDuplicateDecision>;
  }) {
    if (!form.multiEra && form.bookId && selectedBook && !selectedBook.eraId && !form.eraSlug) {
      setError("Select an era for this catalog book, or enable multi-era import.");
      return;
    }
    if (!hasTarget) {
      setError("Choose a catalog book or era before importing.");
      return;
    }

    setLoading(true);
    setError(null);
    if (!params?.decisions) {
      setResult(null);
    }

    try {
      const res = await fetch("/api/admin/catalog-books/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(params)),
      });
      const body = (await res.json().catch(() => ({}))) as ImportCatalogBookCardsResult & {
        error?: string;
      };
      if (!res.ok) throw new Error(body.error ?? "Import failed");

      if (body.needsConfirmation && body.duplicates?.length) {
        setPendingDuplicates(body.duplicates);
        setPendingNewCards(body.newCards ?? []);
        setDuplicateDecisions((current) => {
          const next = { ...current };
          for (const duplicate of body.duplicates ?? []) {
            if (!next[duplicate.seed]) next[duplicate.seed] = "replace";
          }
          return next;
        });
        setResult(null);
        return;
      }

      setPendingDuplicates([]);
      setPendingNewCards([]);
      setDuplicateDecisions({});
      setResult(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }

  function setDecisionForAll(decision: ImportDuplicateDecision) {
    setDuplicateDecisions(
      Object.fromEntries(pendingDuplicates.map((card) => [card.seed, decision])),
    );
  }

  function setDecisionForCard(seed: string, decision: ImportDuplicateDecision) {
    setDuplicateDecisions((current) => ({ ...current, [seed]: decision }));
  }

  async function stageSelectedFolder(files: { relativePath: string; file: File }[], folderName: string) {
    setStagingFolder(true);
    setStagingProgress("Uploading folder…");
    setError(null);
    setResult(null);

    try {
      const staged = await uploadImportFolder(files, (uploaded, total) => {
        setStagingProgress(`Uploading folder… ${uploaded}/${total} files`);
      });

      setForm((current) => ({
        ...current,
        dir: staged.dir,
        bookTitle: current.bookTitle || folderName || staged.folderName,
      }));
      setSelectedFolderLabel(`${folderName || staged.folderName} (${staged.fileCount} files)`);
      setStagingProgress(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload folder");
      setStagingProgress(null);
    } finally {
      setStagingFolder(false);
    }
  }

  async function chooseImportFolder() {
    try {
      const picked = await pickImportFolderWithDirectoryPicker();
      if (picked) {
        await stageSelectedFolder(picked.files, picked.folderName);
        return;
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to open folder picker");
      return;
    }

    folderInputRef.current?.click();
  }

  async function handleFolderInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { files: pickedFiles, folderName } = filesFromDirectoryInput(event.target.files);
    event.target.value = "";
    if (pickedFiles.length === 0) return;
    await stageSelectedFolder(pickedFiles, folderName ?? "import");
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/books"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground/80"
      >
        <ArrowLeft size={15} />
        Back to Books
      </Link>

      <div>
        <div className="flex items-center gap-2">
          <FolderInput size={20} className="text-gold" />
          <h1 className="text-2xl font-semibold text-foreground">Import book cards</h1>
        </div>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Import into a catalog book that already has an era and all cards will use that era
          automatically.
        </p>
      </div>

      <section className="grid gap-4 rounded-xl border border-border bg-surface/40 p-5 sm:grid-cols-2">
        <label className="block space-y-1 sm:col-span-2">
          <span className="text-sm text-foreground/80">Book folder</span>
          <div className="flex gap-2">
            <input
              value={form.dir}
              onChange={(e) => {
                setSelectedFolderLabel(null);
                setForm((current) => ({ ...current, dir: e.target.value }));
              }}
              placeholder="Choose a folder or paste a server path"
              className="min-w-0 flex-1 rounded-md border border-border-strong bg-background px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => void chooseImportFolder()}
              disabled={stagingFolder || loading}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border-strong px-3 py-2 text-sm text-foreground hover:bg-surface disabled:opacity-50"
            >
              <FolderOpen size={15} />
              {stagingFolder ? "Uploading…" : "Choose folder"}
            </button>
          </div>
          <input
            ref={folderInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => void handleFolderInputChange(event)}
            {...({ webkitdirectory: "", directory: "" } as React.InputHTMLAttributes<HTMLInputElement>)}
          />
          {selectedFolderLabel ? (
            <span className="block text-xs text-emerald-400/90">
              Selected {selectedFolderLabel}. Files are staged on the server for import.
            </span>
          ) : (
            <span className="block text-xs text-muted">
              Pick the book folder containing Characters, Units, Locations, and Events subfolders —
              or select a single card-type folder (e.g. Events) to import just those cards.
            </span>
          )}
          {stagingProgress ? (
            <span className="block text-xs text-gold-bright/90">{stagingProgress}</span>
          ) : null}
        </label>

        <label className="block space-y-1 sm:col-span-2">
          <span className="text-sm text-foreground/80">Catalog book</span>
          <select
            value={form.bookId}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                bookId: e.target.value,
                eraSlug: "",
                createBook: e.target.value ? false : current.createBook,
              }))
            }
            className="w-full rounded-md border border-border-strong bg-background px-3 py-2 text-sm"
          >
            <option value="">Choose a book or create from folder name…</option>
            {(catalogBooks ?? []).map((book) => (
              <option key={book.id} value={book.id}>
                {book.title}
                {book.eraName ? ` · ${book.eraName}` : " · no era yet"}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-foreground/80">
            {form.multiEra ? "Default era (optional)" : "Era"}
          </span>
          <select
            value={form.eraSlug}
            disabled={eraLockedToBook}
            onChange={(e) => setForm((current) => ({ ...current, eraSlug: e.target.value }))}
            className="w-full rounded-md border border-border-strong bg-background px-3 py-2 text-sm disabled:opacity-60"
          >
            <option value="">Select era…</option>
            {(eras ?? []).map((era) => (
              <option key={era.id} value={era.slug}>
                {era.name}
              </option>
            ))}
          </select>
          {eraLockedToBook ? (
            <span className="block text-xs text-emerald-400/90">
              Using {selectedBook?.eraName} from the selected book.
            </span>
          ) : form.multiEra ? (
            <span className="block text-xs text-muted">
              Fallback for untagged cards. You can also use era subfolders (
              <code className="text-foreground/80">Characters/tudor-england/Anne Boleyn.png</code> or{" "}
              <code className="text-foreground/80">Events/Battle of Hastings.png</code>
              ), <code className="text-foreground/80">eraSlug</code> in cards.json, or match existing
              codex cards by name.
            </span>
          ) : null}
        </label>

        <label className="flex items-center gap-2 text-sm text-foreground/80 sm:col-span-2">
          <input
            type="checkbox"
            checked={form.multiEra}
            disabled={Boolean(form.bookId && selectedBook?.eraId != null)}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                multiEra: e.target.checked,
                eraSlug: e.target.checked ? current.eraSlug : current.eraSlug,
              }))
            }
          />
          Multi-era book (spans multiple historical periods)
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-foreground/80">Book title override</span>
          <input
            value={form.bookTitle}
            disabled={Boolean(form.bookId)}
            onChange={(e) => setForm((current) => ({ ...current, bookTitle: e.target.value }))}
            placeholder="Defaults to folder name"
            className="w-full rounded-md border border-border-strong bg-background px-3 py-2 text-sm disabled:opacity-60"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-foreground/80">
          <input
            type="checkbox"
            checked={form.createBook}
            disabled={Boolean(form.bookId)}
            onChange={(e) => setForm((current) => ({ ...current, createBook: e.target.checked }))}
          />
          Create catalog book if missing
        </label>

        <label className="flex items-center gap-2 text-sm text-foreground/80">
          <input
            type="checkbox"
            checked={form.mergeLinks}
            onChange={(e) => setForm((current) => ({ ...current, mergeLinks: e.target.checked }))}
          />
          Merge with existing linked cards
        </label>
      </section>

      {pendingDuplicates.length > 0 ? (
        <section className="space-y-4 rounded-xl border border-accent/35 bg-accent/10 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-medium text-foreground">Existing cards found</h2>
              <p className="mt-1 text-sm text-muted">
                {pendingDuplicates.length} duplicate
                {pendingDuplicates.length === 1 ? "" : "s"} and {pendingNewCards.length} new card
                {pendingNewCards.length === 1 ? "" : "s"} ready to import.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDecisionForAll("replace")}
                className="rounded-md border border-border-strong px-3 py-1.5 text-sm text-foreground hover:bg-surface"
              >
                Replace all
              </button>
              <button
                type="button"
                onClick={() => setDecisionForAll("add_variant")}
                className="rounded-md border border-border-strong px-3 py-1.5 text-sm text-foreground hover:bg-surface"
              >
                Add variant all
              </button>
              <button
                type="button"
                onClick={() => setDecisionForAll("ignore")}
                className="rounded-md border border-border-strong px-3 py-1.5 text-sm text-foreground hover:bg-surface"
              >
                Ignore all
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {pendingDuplicates.map((card) => (
              <ImportDuplicateCardReview
                key={card.seed}
                card={card}
                decision={duplicateDecisions[card.seed] ?? "replace"}
                onDecisionChange={(decision) => setDecisionForCard(card.seed, decision)}
              />
            ))}
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => void runImport({ decisions: duplicateDecisions })}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:brightness-110 disabled:opacity-50"
          >
            <Upload size={15} />
            {loading ? "Importing…" : "Continue import"}
          </button>
        </section>
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="rounded-md border border-emerald-900/40 bg-emerald-950/20 px-3 py-2 text-sm text-emerald-300">
          Import complete for &quot;{result.bookTitle}&quot; ({result.eraSlug}) — {result.imported}{" "}
          cards ({result.created} created
          {result.cards.some((entry) => entry.action === "created_variant")
            ? `, ${result.cards.filter((entry) => entry.action === "created_variant").length} variants`
            : ""}
          , {result.updated} replaced, {result.skipped} linked existing, {result.linked} linked to
          book).
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading || !canRun}
          onClick={() => void runImport({ dryRun: true })}
          className="rounded-md border border-border-strong px-4 py-2 text-sm text-foreground hover:bg-surface disabled:opacity-50"
        >
          {loading ? "Running…" : "Preview scan"}
        </button>
        <button
          type="button"
          disabled={loading || !canRun || pendingDuplicates.length > 0}
          onClick={() => void runImport()}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:brightness-110 disabled:opacity-50"
        >
          <Upload size={15} />
          {loading ? "Running…" : "Run import"}
        </button>
      </div>
    </div>
  );
}

export default function ImportBookCardsPage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading import…</p>}>
      <ImportBookCardsPageInner />
    </Suspense>
  );
}
