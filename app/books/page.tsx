"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Plus } from "lucide-react";
import type { Book } from "@/lib/types";
import { PageHeader } from "@/components/page-header";

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
  to_read: "bg-surface-raised text-foreground/80",
  reading: "bg-accent/15 text-gold-bright",
  finished: "bg-emerald-900/50 text-emerald-200",
};

export default function BooksPage() {
  const { data: books, isLoading } = useQuery({ queryKey: ["books"], queryFn: fetchBooks });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Library"
        title="Books"
        description="Books from the platform catalog in your personal reading library."
        icon={BookOpen}
        actions={
          <Link href="/books/browse" className="app-btn-primary">
            <Plus size={16} />
            Browse catalog
          </Link>
        }
      />

      {isLoading && <p className="text-muted">Loading books...</p>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {books?.map((book) => {
          const pct = Math.min(100, Math.round((book.currentPage / book.totalPages) * 100));
          return (
            <Link
              key={book.id}
              href={`/books/${book.id}`}
              className="group rounded-lg border border-border bg-surface/40 p-3 transition-colors hover:border-accent/50"
            >
              <div className="relative mb-2 aspect-[2/3] w-full overflow-hidden rounded bg-surface-raised">
                {book.coverUrl ? (
                  <Image
                    src={book.coverUrl}
                    alt={book.title}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
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
              {book.summary && (
                <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs text-muted">
                  {book.summary}
                </p>
              )}
              <div className="mt-2 flex items-center justify-between">
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${statusColor[book.status]}`}>
                  {statusLabel[book.status]}
                </span>
                <span className="text-[10px] text-muted">{pct}%</span>
              </div>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-raised">
                <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
              </div>
            </Link>
          );
        })}
      </div>

      {books && books.length === 0 && (
        <p className="text-sm text-muted">
          No books in your library yet.{" "}
          <Link href="/books/browse" className="text-gold hover:underline">
            Browse the catalog
          </Link>
          .
        </p>
      )}
    </div>
  );
}
