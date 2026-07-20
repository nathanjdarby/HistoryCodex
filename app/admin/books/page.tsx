"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, FolderInput, LayoutGrid, List, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import type { Era } from "@/lib/types";
import { BookCoverUpload } from "@/components/book-cover-upload";
import { CatalogBookCardPicker } from "@/components/catalog-book-card-picker";
import { applyPastedTextToTextarea } from "@/lib/client/paste-text";

type CatalogBook = {
  id: number;
  title: string;
  author: string | null;
  coverUrl: string | null;
  summary: string | null;
  totalPages: number;
  eraId: number | null;
  eraName: string | null;
  timelineYear: number | null;
  active: boolean;
  cardCount?: number;
};

type SearchResult = {
  source: "open_library" | "google_books";
  title: string;
  author: string | null;
  isbn: string | null;
  openLibraryId: string | null;
  googleBooksId: string | null;
  coverUrl: string | null;
  estimatedPages: number | null;
  summary: string | null;
};

type BookSearchResponse = {
  results: SearchResult[];
  warnings: string[];
};

type FormState = {
  title: string;
  author: string;
  summary: string;
  isbn: string;
  openLibraryId: string;
  coverUrl: string;
  totalPages: string;
  eraId: string;
  timelineYear: string;
  active: boolean;
};

const emptyForm: FormState = {
  title: "",
  author: "",
  summary: "",
  isbn: "",
  openLibraryId: "",
  coverUrl: "",
  totalPages: "",
  eraId: "",
  timelineYear: "",
  active: true,
};

async function fetchCatalog(): Promise<CatalogBook[]> {
  const res = await fetch("/api/admin/catalog-books");
  if (!res.ok) throw new Error("Failed to load catalog");
  return res.json();
}

async function fetchEras(): Promise<Era[]> {
  const res = await fetch("/api/eras");
  if (!res.ok) throw new Error("Failed to load eras");
  return res.json();
}

function toForm(book: CatalogBook, eras?: Era[]): FormState {
  const eraStartYear =
    book.eraId != null ? eras?.find((era) => era.id === book.eraId)?.startYear : undefined;
  return {
    title: book.title,
    author: book.author ?? "",
    summary: book.summary ?? "",
    isbn: "",
    openLibraryId: "",
    coverUrl: book.coverUrl ?? "",
    totalPages: String(book.totalPages),
    eraId: book.eraId ? String(book.eraId) : "",
    timelineYear:
      book.timelineYear != null
        ? String(book.timelineYear)
        : eraStartYear != null
          ? String(eraStartYear)
          : "",
    active: book.active,
  };
}

type ViewMode = "list" | "gallery";

function CatalogBookCover({
  book,
  className = "aspect-[2/3]",
  iconSize = 28,
}: {
  book: CatalogBook;
  className?: string;
  iconSize?: number;
}) {
  return (
    <div className={`relative w-full overflow-hidden rounded bg-surface-raised ${className}`}>
      {book.coverUrl ? (
        <Image src={book.coverUrl} alt={book.title} fill sizes="200px" className="object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center text-subtle">
          <BookOpen size={iconSize} />
        </div>
      )}
    </div>
  );
}

export default function AdminBooksPage() {
  const queryClient = useQueryClient();
  const { data: catalog, isLoading } = useQuery({
    queryKey: ["admin-catalog-books"],
    queryFn: fetchCatalog,
  });
  const { data: eras } = useQuery({ queryKey: ["eras"], queryFn: fetchEras });

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchWarnings, setSearchWarnings] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("gallery");

  async function runSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError(null);
    setSearchWarnings([]);
    try {
      const res = await fetch(`/api/book-search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = (await res.json().catch(() => null)) as BookSearchResponse | null;
      if (!res.ok) {
        throw new Error(
          data && typeof data === "object" && "error" in data && typeof data.error === "string"
            ? data.error
            : "Book search failed",
        );
      }
      if (!data || !Array.isArray(data.results)) {
        throw new Error("Unexpected search response");
      }
      setSearchResults(data.results);
      setSearchWarnings(data.warnings ?? []);
      if (data.results.length === 0 && (data.warnings?.length ?? 0) === 0) {
        setError("No results found.");
      }
    } catch (err) {
      setSearchResults([]);
      setSearchWarnings([]);
      setError(err instanceof Error ? err.message : "Book search failed");
    } finally {
      setSearching(false);
    }
  }

  function pickResult(r: SearchResult) {
    setForm((f) => ({
      ...f,
      title: r.title,
      author: r.author ?? "",
      isbn: r.isbn ?? "",
      openLibraryId: r.openLibraryId ?? "",
      coverUrl: r.coverUrl ?? "",
      totalPages: r.estimatedPages ? String(r.estimatedPages) : f.totalPages,
      summary: r.summary?.trim() ? r.summary : f.summary,
    }));
    setSearchResults([]);
    setSearchWarnings([]);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        author: form.author || null,
        summary: form.summary || null,
        isbn: form.isbn || null,
        openLibraryId: form.openLibraryId || null,
        coverUrl: form.coverUrl || null,
        totalPages: Number(form.totalPages),
        eraId: form.eraId ? Number(form.eraId) : null,
        timelineYear: form.timelineYear.trim() ? Number(form.timelineYear) : null,
        active: form.active,
      };
      const res = await fetch(
        editingId ? `/api/admin/catalog-books/${editingId}` : "/api/admin/catalog-books",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save book");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-catalog-books"] });
      queryClient.invalidateQueries({ queryKey: ["catalog-books"] });
      closeForm();
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/catalog-books/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to delete");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-catalog-books"] });
      queryClient.invalidateQueries({ queryKey: ["catalog-books"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setSearchResults([]);
    setSearchWarnings([]);
  }

  function openCreate() {
    setError(null);
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(book: CatalogBook) {
    setError(null);
    setEditingId(book.id);
    setForm(toForm(book, eras));
    setFormOpen(true);
  }

  const filtered = (catalog ?? []).filter((book) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      book.title.toLowerCase().includes(q) ||
      (book.author?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Platform books</h1>
          <p className="text-sm text-muted">
            Curate the catalog users browse when adding titles to their library.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/books/import"
            className="inline-flex items-center gap-1.5 rounded-md border border-border-strong px-3 py-2 text-sm text-foreground hover:bg-surface"
          >
            <FolderInput size={16} />
            Import cards
          </Link>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:brightness-110"
          >
            <Plus size={16} />
            Add catalog book
          </button>
        </div>
      </div>

      {error && !formOpen && (
        <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter catalog…"
          className="w-full max-w-md rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm"
        />
        <div className="flex rounded-md border border-border-strong bg-surface p-0.5 text-sm">
          <button
            type="button"
            onClick={() => setViewMode("gallery")}
            className={`rounded p-1.5 ${
              viewMode === "gallery"
                ? "bg-surface-raised text-foreground"
                : "text-muted hover:text-foreground"
            }`}
            aria-label="Gallery view"
            title="Gallery view"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`rounded p-1.5 ${
              viewMode === "list"
                ? "bg-surface-raised text-foreground"
                : "text-muted hover:text-foreground"
            }`}
            aria-label="List view"
            title="List view"
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted">Loading catalog…</p>}

      {!isLoading && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <BookOpen size={28} className="mx-auto text-subtle" />
          <p className="mt-3 text-foreground/80">No books match your filter.</p>
        </div>
      )}

      {viewMode === "gallery" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((book) => (
            <article
              key={book.id}
              className="group flex flex-col rounded-xl border border-border bg-surface/40 p-3"
            >
              <CatalogBookCover book={book} className="mb-3 aspect-[2/3]" />
              <div className="flex min-h-0 flex-1 flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                    {book.title}
                  </p>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] ${
                      book.active
                        ? "bg-emerald-900/50 text-emerald-200"
                        : "bg-surface-raised text-muted"
                    }`}
                  >
                    {book.active ? "Active" : "Hidden"}
                  </span>
                </div>
                <p className="line-clamp-1 text-xs text-muted">
                  {book.author ?? "Unknown author"}
                </p>
                <p className="text-[10px] text-muted">
                  {book.totalPages} pp
                  {book.eraName ? ` · ${book.eraName}` : ""}
                  {(book.cardCount ?? 0) > 0 ? ` · ${book.cardCount} cards` : ""}
                </p>
              </div>
              <div className="mt-3 flex gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => openEdit(book)}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-border-strong px-2 py-1.5 text-xs text-foreground/80 hover:bg-surface-raised"
                >
                  <Pencil size={12} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete "${book.title}" from the catalog?`)) {
                      deleteMutation.mutate(book.id);
                    }
                  }}
                  className="rounded-md border border-red-900/50 p-1.5 text-red-400 hover:bg-red-950/40"
                  aria-label={`Delete ${book.title}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((book) => (
            <article
              key={book.id}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface/40 p-4"
            >
              <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded bg-surface-raised">
                {book.coverUrl ? (
                  <Image src={book.coverUrl} alt="" fill sizes="44px" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-subtle">
                    <BookOpen size={16} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{book.title}</p>
                <p className="text-sm text-muted">
                  {book.author ?? "Unknown author"} · {book.totalPages} pp
                  {book.eraName ? ` · ${book.eraName}` : ""}
                  {(book.cardCount ?? 0) > 0 ? ` · ${book.cardCount} cards` : ""}
                </p>
              </div>
              <span
                className={`rounded px-2 py-0.5 text-xs ${book.active ? "bg-emerald-900/50 text-emerald-200" : "bg-surface-raised text-muted"}`}
              >
                {book.active ? "Active" : "Hidden"}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(book)}
                  className="rounded border border-border-strong p-1.5 text-muted hover:bg-surface-raised"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete "${book.title}" from the catalog?`)) {
                      deleteMutation.mutate(book.id);
                    }
                  }}
                  className="rounded border border-red-900/50 p-1.5 text-red-400 hover:bg-red-950/40"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 py-6 backdrop-blur-sm"
          onClick={closeForm}
        >
          <section
            className="w-full max-w-3xl shrink-0 rounded-xl border border-border bg-surface p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-foreground">
                {editingId ? "Edit catalog book" : "New catalog book"}
              </h2>
              <button type="button" onClick={closeForm} className="text-muted hover:text-foreground/80">
                <X size={18} />
              </button>
            </div>

            {error && (
              <p className="mb-4 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            {!editingId && (
              <div className="mb-4 flex gap-2">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void runSearch();
                    }
                  }}
                  placeholder="Search Open Library & Google Books…"
                  className="flex-1 rounded border border-border-strong bg-background px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={runSearch}
                  disabled={searching}
                  className="inline-flex items-center gap-1 rounded-md border border-border-strong px-3 py-2 text-sm hover:bg-surface-raised"
                >
                  <Search size={14} />
                  {searching ? "…" : "Search"}
                </button>
              </div>
            )}

            {searchWarnings.length > 0 && (
              <div className="mb-4 space-y-1 rounded border border-accent/35 bg-accent/10 px-3 py-2 text-xs text-gold-bright/90">
                {searchWarnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="mb-4 max-h-48 space-y-1 overflow-y-auto rounded border border-border p-2">
                {searchResults.map((r) => (
                  <button
                    key={`${r.source}-${r.openLibraryId ?? r.googleBooksId ?? r.title}`}
                    type="button"
                    onClick={() => pickResult(r)}
                    className="flex w-full items-start gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-surface-raised"
                  >
                    {r.coverUrl ? (
                      <img
                        src={r.coverUrl}
                        alt=""
                        className="mt-0.5 h-[42px] w-7 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <span className="mt-0.5 flex h-[42px] w-7 shrink-0 items-center justify-center rounded bg-surface-raised text-subtle">
                        <BookOpen size={12} />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-foreground">{r.title}</span>
                      <span className="block truncate text-xs text-muted">
                        {r.author ?? "Unknown author"}
                        {r.estimatedPages ? ` · ${r.estimatedPages} pp` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 rounded bg-surface-raised px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                      {r.source === "google_books" ? "Google" : "Open Library"}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate();
              }}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            >
              <div className="sm:col-span-2">
                <BookCoverUpload
                  coverUrl={form.coverUrl || null}
                  title={form.title || "Book cover"}
                  onCoverUrlChange={(url) => setForm((f) => ({ ...f, coverUrl: url ?? "" }))}
                />
              </div>
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                Title
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="rounded border border-border-strong bg-background px-2 py-1.5"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Author
                <input
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  className="rounded border border-border-strong bg-background px-2 py-1.5"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Total pages
                <input
                  required
                  type="number"
                  min={1}
                  value={form.totalPages}
                  onChange={(e) => setForm({ ...form, totalPages: e.target.value })}
                  className="rounded border border-border-strong bg-background px-2 py-1.5"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                Summary
                <textarea
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  onPaste={(e) =>
                    applyPastedTextToTextarea(e, form.summary, (summary) => setForm({ ...form, summary }), 2000)
                  }
                  rows={3}
                  className="rounded border border-border-strong bg-background px-2 py-1.5"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Era
                <select
                  value={form.eraId}
                  onChange={(e) => {
                    const eraId = e.target.value;
                    const era = eras?.find((item) => String(item.id) === eraId);
                    setForm((f) => ({
                      ...f,
                      eraId,
                      timelineYear:
                        f.timelineYear.trim() || !era
                          ? f.timelineYear
                          : String(era.startYear),
                    }));
                  }}
                  className="rounded border border-border-strong bg-background px-2 py-1.5"
                >
                  <option value="">— None (multi-era) —</option>
                  {eras?.map((era) => (
                    <option key={era.id} value={era.id}>
                      {era.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Starting year
                <input
                  type="number"
                  value={form.timelineYear}
                  onChange={(e) => setForm({ ...form, timelineYear: e.target.value })}
                  placeholder="Timeline placement"
                  className="rounded border border-border-strong bg-background px-2 py-1.5"
                />
                <span className="text-xs text-muted">
                  Where this book sits on the timeline when added to a library. Defaults from era if
                  set.
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
                Visible in user catalog
              </label>
              <div className="flex gap-2 sm:col-span-2">
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:brightness-110 disabled:opacity-50"
                >
                  {saveMutation.isPending ? "Saving…" : "Save"}
                </button>
              </div>
            </form>

            {editingId != null && (
              <div className="mt-6 space-y-4 border-t border-border pt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-medium text-foreground">Book cards</h3>
                    <p className="text-sm text-muted">
                      Import card art from a folder or manage linked cards manually.
                    </p>
                  </div>
                  <Link
                    href={`/admin/books/import?bookId=${editingId}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border-strong px-3 py-2 text-sm text-foreground hover:bg-surface"
                  >
                    <FolderInput size={15} />
                    Import cards
                  </Link>
                </div>
                <CatalogBookCardPicker
                  catalogBookId={editingId}
                  eraId={form.eraId ? Number(form.eraId) : null}
                  onError={setError}
                />
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
