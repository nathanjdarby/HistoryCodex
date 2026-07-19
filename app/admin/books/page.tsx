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

function toForm(book: CatalogBook): FormState {
  return {
    title: book.title,
    author: book.author ?? "",
    summary: book.summary ?? "",
    isbn: "",
    openLibraryId: "",
    coverUrl: book.coverUrl ?? "",
    totalPages: String(book.totalPages),
    eraId: book.eraId ? String(book.eraId) : "",
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
    <div className={`relative w-full overflow-hidden rounded bg-neutral-800 ${className}`}>
      {book.coverUrl ? (
        <Image src={book.coverUrl} alt={book.title} fill sizes="200px" className="object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center text-neutral-600">
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
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(book: CatalogBook) {
    setEditingId(book.id);
    setForm(toForm(book));
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
          <h1 className="text-2xl font-semibold text-neutral-100">Platform books</h1>
          <p className="text-sm text-neutral-500">
            Curate the catalog users browse when adding titles to their library.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/books/import"
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-700 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
          >
            <FolderInput size={16} />
            Import cards
          </Link>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-md bg-amber-700 px-3 py-2 text-sm font-medium text-amber-50 hover:bg-amber-600"
          >
            <Plus size={16} />
            Add catalog book
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {formOpen && (
        <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-neutral-100">
              {editingId ? "Edit catalog book" : "New catalog book"}
            </h2>
            <button type="button" onClick={closeForm} className="text-neutral-500 hover:text-neutral-300">
              <X size={18} />
            </button>
          </div>

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
                className="flex-1 rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={runSearch}
                disabled={searching}
                className="inline-flex items-center gap-1 rounded-md border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-800"
              >
                <Search size={14} />
                {searching ? "…" : "Search"}
              </button>
            </div>
          )}

          {searchWarnings.length > 0 && (
            <div className="mb-4 space-y-1 rounded border border-amber-900/40 bg-amber-950/20 px-3 py-2 text-xs text-amber-200/90">
              {searchWarnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="mb-4 max-h-48 space-y-1 overflow-y-auto rounded border border-neutral-800 p-2">
              {searchResults.map((r) => (
                <button
                  key={`${r.source}-${r.openLibraryId ?? r.googleBooksId ?? r.title}`}
                  type="button"
                  onClick={() => pickResult(r)}
                  className="flex w-full items-start gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-neutral-800"
                >
                  {r.coverUrl ? (
                    <img
                      src={r.coverUrl}
                      alt=""
                      className="mt-0.5 h-[42px] w-7 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <span className="mt-0.5 flex h-[42px] w-7 shrink-0 items-center justify-center rounded bg-neutral-800 text-neutral-600">
                      <BookOpen size={12} />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-neutral-100">{r.title}</span>
                    <span className="block truncate text-xs text-neutral-500">
                      {r.author ?? "Unknown author"}
                      {r.estimatedPages ? ` · ${r.estimatedPages} pp` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-neutral-400">
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
                className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Author
              <input
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5"
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
                className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5"
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
                className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Era
              <select
                value={form.eraId}
                onChange={(e) => setForm({ ...form, eraId: e.target.value })}
                className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5"
              >
                <option value="">— None —</option>
                {eras?.map((era) => (
                  <option key={era.id} value={era.id}>
                    {era.name}
                  </option>
                ))}
              </select>
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
                className="rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-amber-600 disabled:opacity-50"
              >
                {saveMutation.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </form>

          {editingId != null && (
            <div className="mt-6 space-y-4 border-t border-neutral-800 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-medium text-neutral-100">Book cards</h3>
                  <p className="text-sm text-neutral-500">
                    Import card art from a folder or manage linked cards manually.
                  </p>
                </div>
                <Link
                  href={`/admin/books/import?bookId=${editingId}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-neutral-700 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
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
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter catalog…"
          className="w-full max-w-md rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
        />
        <div className="flex rounded-md border border-neutral-700 bg-neutral-900 p-0.5 text-sm">
          <button
            type="button"
            onClick={() => setViewMode("gallery")}
            className={`rounded p-1.5 ${
              viewMode === "gallery"
                ? "bg-neutral-700 text-neutral-100"
                : "text-neutral-400 hover:text-neutral-200"
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
                ? "bg-neutral-700 text-neutral-100"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
            aria-label="List view"
            title="List view"
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-neutral-500">Loading catalog…</p>}

      {!isLoading && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-800 px-6 py-10 text-center">
          <BookOpen size={28} className="mx-auto text-neutral-600" />
          <p className="mt-3 text-neutral-300">No books match your filter.</p>
        </div>
      )}

      {viewMode === "gallery" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((book) => (
            <article
              key={book.id}
              className="group flex flex-col rounded-xl border border-neutral-800 bg-neutral-900/40 p-3"
            >
              <CatalogBookCover book={book} className="mb-3 aspect-[2/3]" />
              <div className="flex min-h-0 flex-1 flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-sm font-medium leading-snug text-neutral-100">
                    {book.title}
                  </p>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] ${
                      book.active
                        ? "bg-emerald-900/50 text-emerald-200"
                        : "bg-neutral-800 text-neutral-400"
                    }`}
                  >
                    {book.active ? "Active" : "Hidden"}
                  </span>
                </div>
                <p className="line-clamp-1 text-xs text-neutral-500">
                  {book.author ?? "Unknown author"}
                </p>
                <p className="text-[10px] text-neutral-500">
                  {book.totalPages} pp
                  {book.eraName ? ` · ${book.eraName}` : ""}
                  {(book.cardCount ?? 0) > 0 ? ` · ${book.cardCount} cards` : ""}
                </p>
              </div>
              <div className="mt-3 flex gap-2 border-t border-neutral-800 pt-3">
                <button
                  type="button"
                  onClick={() => openEdit(book)}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-neutral-700 px-2 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800"
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
              className="flex flex-wrap items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4"
            >
              <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded bg-neutral-800">
                {book.coverUrl ? (
                  <Image src={book.coverUrl} alt="" fill sizes="44px" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-neutral-600">
                    <BookOpen size={16} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-neutral-100">{book.title}</p>
                <p className="text-sm text-neutral-500">
                  {book.author ?? "Unknown author"} · {book.totalPages} pp
                  {book.eraName ? ` · ${book.eraName}` : ""}
                  {(book.cardCount ?? 0) > 0 ? ` · ${book.cardCount} cards` : ""}
                </p>
              </div>
              <span
                className={`rounded px-2 py-0.5 text-xs ${book.active ? "bg-emerald-900/50 text-emerald-200" : "bg-neutral-800 text-neutral-400"}`}
              >
                {book.active ? "Active" : "Hidden"}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(book)}
                  className="rounded border border-neutral-700 p-1.5 text-neutral-400 hover:bg-neutral-800"
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
    </div>
  );
}
