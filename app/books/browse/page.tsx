"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Check, Loader2, Plus, Search } from "lucide-react";
import { AddBookDialog } from "@/components/add-book-dialog";
import { CatalogBooksEraSections } from "@/components/catalog-books-era-sections";
import { PageHeader } from "@/components/page-header";
import type { ConsumptionFormat } from "@/lib/book-progress";
import type { Era } from "@/lib/types";

type CatalogBook = {
  id: number;
  title: string;
  author: string | null;
  coverUrl: string | null;
  summary: string | null;
  totalPages: number;
  eraId: number | null;
  eraName: string | null;
  inLibrary: boolean;
};

type AddBookInput = {
  catalogBookId: number;
  consumptionFormat: ConsumptionFormat;
  editionTotalPages?: number;
  totalDurationSeconds?: number;
};

async function fetchCatalog(): Promise<CatalogBook[]> {
  const res = await fetch("/api/catalog-books");
  if (!res.ok) throw new Error("Failed to load catalog");
  return res.json();
}

async function fetchEras(): Promise<Era[]> {
  const res = await fetch("/api/eras");
  if (!res.ok) throw new Error("Failed to load eras");
  return res.json();
}

export default function BrowseCatalogPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [addTarget, setAddTarget] = useState<CatalogBook | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  const { data: catalog, isLoading } = useQuery({
    queryKey: ["catalog-books"],
    queryFn: fetchCatalog,
  });
  const { data: eras } = useQuery({ queryKey: ["eras"], queryFn: fetchEras });

  const addMutation = useMutation({
    mutationFn: async (input: AddBookInput) => {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to add book");
      }
      return res.json();
    },
    onMutate: () => setAddError(null),
    onSuccess: (book) => {
      setAddTarget(null);
      queryClient.invalidateQueries({ queryKey: ["catalog-books"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["profile-timelines"] });
      router.push(`/books/${book.id}`);
    },
    onError: (err: Error) => setAddError(err.message),
  });

  const filtered = (catalog ?? []).filter((book) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      book.title.toLowerCase().includes(q) ||
      (book.author?.toLowerCase().includes(q) ?? false);
    return matchesQuery;
  });

  return (
    <div className="space-y-6">
      <Link href="/books" className="app-link inline-flex items-center gap-1.5 text-sm">
        <ArrowLeft size={15} />
        My library
      </Link>

      <PageHeader
        eyebrow="Catalog"
        title="Browse catalog"
        description="Pick a platform book to add to your library and start earning era points as you read, listen, or read on your device."
        icon={BookOpen}
      />

      <div className="relative max-w-xl">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title or author…"
          className="app-input w-full py-2 pl-9 pr-3"
        />
      </div>

      {isLoading && <p className="text-sm text-muted">Loading catalog…</p>}

      {addError && !addTarget && (
        <div className="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-2 text-sm text-red-200">
          {addError}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <BookOpen size={28} className="mx-auto text-subtle" />
          <p className="mt-3 text-foreground/80">No books match your search.</p>
          <p className="mt-1 text-sm text-muted">
            Platform titles are added by admins — check back soon.
          </p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && eras && (
        <CatalogBooksEraSections
          books={filtered}
          eras={eras}
          getBookKey={(book) => book.id}
          renderBook={(book) => (
            <article className="flex flex-wrap items-center gap-4 px-4 py-3">
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
                  {book.author ?? "Unknown author"} · {book.totalPages} pages
                </p>
              </div>
              {book.inLibrary ? (
                <span className="inline-flex shrink-0 items-center gap-1 text-xs text-emerald-400">
                  <Check size={14} />
                  In your library
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAddError(null);
                    setAddTarget(book);
                  }}
                  className="app-btn-primary inline-flex shrink-0 items-center gap-1 px-3 py-2 text-xs"
                >
                  <Plus size={14} />
                  Add to library
                </button>
              )}
            </article>
          )}
        />
      )}

      <AddBookDialog
        book={addTarget}
        open={addTarget != null}
        pending={addMutation.isPending}
        error={addError}
        onConfirm={(input) => addMutation.mutate(input)}
        onCancel={() => {
          setAddTarget(null);
          setAddError(null);
        }}
      />
    </div>
  );
}
