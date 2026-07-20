"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { ArrowLeft, BookOpen, Check, Loader2, Plus, Search } from "lucide-react";
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
  const [eraFilter, setEraFilter] = useState("");

  const { data: catalog, isLoading } = useQuery({
    queryKey: ["catalog-books"],
    queryFn: fetchCatalog,
  });
  const { data: eras } = useQuery({ queryKey: ["eras"], queryFn: fetchEras });

  const [addError, setAddError] = useState<string | null>(null);

  const addMutation = useMutation({
    mutationFn: async (catalogBookId: number) => {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catalogBookId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to add book");
      }
      return res.json();
    },
    onMutate: () => setAddError(null),
    onSuccess: (book) => {
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
    const matchesEra = !eraFilter || String(book.eraId) === eraFilter;
    return matchesQuery && matchesEra;
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
        description="Pick a platform book to add to your library and start earning era points as you read."
        icon={BookOpen}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title or author…"
            className="app-input w-full py-2 pl-9 pr-3"
          />
        </div>
        <select
          value={eraFilter}
          onChange={(e) => setEraFilter(e.target.value)}
          className="app-input py-2"
        >
          <option value="">All eras</option>
          {eras?.map((era) => (
            <option key={era.id} value={era.id}>
              {era.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-sm text-muted">Loading catalog…</p>}

      {addError && (
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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filtered.map((book) => (
          <article
            key={book.id}
            className="relative flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-surface/40 p-3"
          >
            <div className="relative z-0 mb-2 aspect-[2/3] w-full shrink-0 overflow-hidden rounded bg-surface-raised">
              {book.coverUrl ? (
                <Image src={book.coverUrl} alt={book.title} fill sizes="200px" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-subtle">
                  <BookOpen size={28} />
                </div>
              )}
            </div>
            <p className="line-clamp-2 text-sm font-medium text-foreground">{book.title}</p>
            {book.author && (
              <p className="line-clamp-1 text-xs text-muted">{book.author}</p>
            )}
            {book.eraName && (
              <p className="mt-1 text-[10px] text-muted">{book.eraName}</p>
            )}
            <p className="mt-1 text-[10px] text-muted">{book.totalPages} pages</p>
            {book.inLibrary ? (
              <span className="mt-auto inline-flex shrink-0 items-center gap-1 pt-3 text-xs text-emerald-400">
                <Check size={14} />
                In your library
              </span>
            ) : (
              <button
                type="button"
                onClick={() => addMutation.mutate(book.id)}
                disabled={addMutation.isPending && addMutation.variables === book.id}
                className="app-btn-primary relative z-10 mt-3 w-full shrink-0 py-2 text-xs disabled:cursor-not-allowed"
              >
                {addMutation.isPending && addMutation.variables === book.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Plus size={14} />
                )}
                Add to library
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
