"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Plus, BookOpen } from "lucide-react";
import type { Book } from "@/lib/types";

async function fetchBooks(): Promise<Book[]> {
  const res = await fetch("/api/books");
  if (!res.ok) throw new Error("Failed to load books");
  return res.json();
}

const statusLabel: Record<Book["status"], string> = {
  to_read: "To read",
  reading: "Reading",
  finished: "Finished",
};

const statusColor: Record<Book["status"], string> = {
  to_read: "bg-neutral-800 text-neutral-300",
  reading: "bg-amber-900/50 text-amber-200",
  finished: "bg-emerald-900/50 text-emerald-200",
};

export default function BooksPage() {
  const { data: books, isLoading } = useQuery({ queryKey: ["books"], queryFn: fetchBooks });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-amber-100">Books</h1>
          <p className="text-sm text-neutral-400">
            Books from the platform catalog in your personal reading library.
          </p>
        </div>
        <Link
          href="/books/browse"
          className="flex items-center gap-1.5 rounded-md bg-amber-700 px-3 py-2 text-sm font-medium text-amber-50 hover:bg-amber-600"
        >
          <Plus size={16} />
          Browse catalog
        </Link>
      </div>

      {isLoading && <p className="text-neutral-500">Loading books...</p>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {books?.map((book) => {
          const pct = Math.min(100, Math.round((book.currentPage / book.totalPages) * 100));
          return (
            <Link
              key={book.id}
              href={`/books/${book.id}`}
              className="group rounded-lg border border-neutral-800 bg-neutral-900/40 p-3 transition-colors hover:border-amber-700/50"
            >
              <div className="relative mb-2 aspect-[2/3] w-full overflow-hidden rounded bg-neutral-800">
                {book.coverUrl ? (
                  <Image
                    src={book.coverUrl}
                    alt={book.title}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
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
              {book.summary && (
                <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs text-neutral-400">
                  {book.summary}
                </p>
              )}
              <div className="mt-2 flex items-center justify-between">
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${statusColor[book.status]}`}>
                  {statusLabel[book.status]}
                </span>
                <span className="text-[10px] text-neutral-500">{pct}%</span>
              </div>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-neutral-800">
                <div className="h-full bg-amber-600" style={{ width: `${pct}%` }} />
              </div>
            </Link>
          );
        })}
      </div>

      {books && books.length === 0 && (
        <p className="text-sm text-neutral-500">
          No books in your library yet.{" "}
          <Link href="/books/browse" className="text-amber-400 hover:underline">
            Browse the catalog
          </Link>
          .
        </p>
      )}
    </div>
  );
}
