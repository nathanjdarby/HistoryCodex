"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Check, Plus, Search } from "lucide-react";
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
    onSuccess: (book) => {
      queryClient.invalidateQueries({ queryKey: ["catalog-books"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      router.push(`/books/${book.id}`);
    },
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
      <Link
        href="/books"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-200"
      >
        <ArrowLeft size={15} />
        My library
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-amber-100">Browse catalog</h1>
        <p className="text-sm text-neutral-400">
          Pick a platform book to add to your library and start earning era points as you read.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title or author…"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          value={eraFilter}
          onChange={(e) => setEraFilter(e.target.value)}
          className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
        >
          <option value="">All eras</option>
          {eras?.map((era) => (
            <option key={era.id} value={era.id}>
              {era.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-sm text-neutral-500">Loading catalog…</p>}

      {!isLoading && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-800 px-6 py-10 text-center">
          <BookOpen size={28} className="mx-auto text-neutral-600" />
          <p className="mt-3 text-neutral-300">No books match your search.</p>
          <p className="mt-1 text-sm text-neutral-500">
            Platform titles are added by admins — check back soon.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filtered.map((book) => (
          <article
            key={book.id}
            className="flex flex-col rounded-lg border border-neutral-800 bg-neutral-900/40 p-3"
          >
            <div className="relative mb-2 aspect-[2/3] w-full overflow-hidden rounded bg-neutral-800">
              {book.coverUrl ? (
                <Image src={book.coverUrl} alt={book.title} fill sizes="200px" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-neutral-600">
                  <BookOpen size={28} />
                </div>
              )}
            </div>
            <p className="line-clamp-2 text-sm font-medium text-neutral-100">{book.title}</p>
            {book.author && (
              <p className="line-clamp-1 text-xs text-neutral-500">{book.author}</p>
            )}
            {book.eraName && (
              <p className="mt-1 text-[10px] text-neutral-500">{book.eraName}</p>
            )}
            <p className="mt-1 text-[10px] text-neutral-500">{book.totalPages} pages</p>
            {book.inLibrary ? (
              <span className="mt-auto inline-flex items-center gap-1 pt-3 text-xs text-emerald-400">
                <Check size={14} />
                In your library
              </span>
            ) : (
              <button
                type="button"
                onClick={() => addMutation.mutate(book.id)}
                disabled={addMutation.isPending}
                className="mt-auto inline-flex items-center justify-center gap-1 rounded-md bg-amber-700 px-2 py-1.5 pt-3 text-xs font-medium text-amber-50 hover:bg-amber-600 disabled:opacity-50"
              >
                <Plus size={14} />
                Add to library
              </button>
            )}
          </article>
        ))}
      </div>

      {addMutation.isError && (
        <p className="text-sm text-red-400">{(addMutation.error as Error).message}</p>
      )}
    </div>
  );
}
