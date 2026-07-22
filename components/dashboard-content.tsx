"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import type { Book, Character, Era } from "@/lib/types";
import { formatProgressLabel, getProgressPercent } from "@/lib/book-progress";
import { DashboardRecentUnlocks } from "@/components/dashboard-recent-unlocks";
import { PageSection } from "@/components/page-header";

type CharacterWithEra = Character & {
  era: Era;
  owned: boolean;
  quantity?: number;
  unlockedAt: string | null;
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  return res.json();
}

function progressPct(book: Book) {
  return getProgressPercent(book);
}

function BookPreviewCard({
  book,
  showProgress = false,
}: {
  book: Book;
  showProgress?: boolean;
}) {
  const pct = progressPct(book);

  return (
    <Link
      href={`/books/${book.id}`}
      className="group w-[9.5rem] shrink-0 rounded-lg border border-border bg-surface/40 p-2.5 transition-colors hover:border-accent/50 sm:w-auto"
    >
      <div className="relative mb-2 aspect-[2/3] w-full overflow-hidden rounded-md bg-surface-raised shadow-sm ring-1 ring-white/5">
        {book.coverUrl ? (
          <Image
            src={book.coverUrl}
            alt={book.title}
            fill
            sizes="(max-width: 640px) 152px, 180px"
            className="object-cover transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-subtle">
            <BookOpen size={28} />
          </div>
        )}
      </div>
      <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">{book.title}</p>
      {book.author && <p className="mt-0.5 line-clamp-1 text-xs text-muted">{book.author}</p>}
      {showProgress ? (
        <>
          <p className="mt-1.5 text-[11px] text-muted">
            {formatProgressLabel(book)}
          </p>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-raised">
            <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
          </div>
        </>
      ) : (
        <p className="mt-1.5 text-[11px] text-muted">{book.totalPages} pages</p>
      )}
    </Link>
  );
}

function BookShelfSection({
  title,
  books,
  emptyMessage,
  emptyAction,
  showProgress = false,
}: {
  title: string;
  books: Book[];
  emptyMessage: string;
  emptyAction?: { href: string; label: string };
  showProgress?: boolean;
}) {
  return (
    <PageSection
      title={title}
      action={
        <Link href="/books" className="app-link text-xs">
          View all books
        </Link>
      }
    >
      {books.length === 0 ? (
        <div className="app-empty text-sm">
          {emptyMessage}
          {emptyAction && (
            <div className="mt-2">
              <Link href={emptyAction.href} className="app-link">
                {emptyAction.label}
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {books.map((book) => (
            <BookPreviewCard key={book.id} book={book} showProgress={showProgress} />
          ))}
        </div>
      )}
    </PageSection>
  );
}

export function DashboardContent() {
  const { data: books } = useQuery({ queryKey: ["books"], queryFn: () => fetchJson<Book[]>("/api/books") });
  const { data: characters } = useQuery({
    queryKey: ["characters"],
    queryFn: () => fetchJson<CharacterWithEra[]>("/api/characters"),
  });

  const toRead = [...(books ?? [])]
    .filter((book) => book.status === "to_read")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);
  const inProgress = [...(books ?? [])]
    .filter((book) => book.status === "reading")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8);
  const recentUnlocks = (characters ?? [])
    .filter((c) => c.owned && c.unlockedAt)
    .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
    .slice(0, 5);

  const hasNothingYet = books?.length === 0;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
      {hasNothingYet && (
        <div className="app-empty">
          <p className="text-foreground/80">Your codex is empty. Browse the catalog to start reading.</p>
          <div className="mt-3 flex justify-center gap-2">
            <Link href="/books/browse" className="app-btn-primary">
              Browse catalog
            </Link>
          </div>
        </div>
      )}

      <BookShelfSection
        title="In progress"
        books={inProgress}
        showProgress
        emptyMessage="No books in progress yet. Open a book and log your page count to start earning points."
        emptyAction={{ href: "/books", label: "Browse your library" }}
      />

      <BookShelfSection
        title="To read"
        books={toRead}
        emptyMessage="Your reading queue is empty."
        emptyAction={{ href: "/books/browse", label: "Browse the catalog" }}
      />

      <PageSection
        title="Recent unlocks"
        action={
          <Link href="/collection" className="app-link text-xs">
            View collection
          </Link>
        }
      >
        <DashboardRecentUnlocks characters={recentUnlocks} />
      </PageSection>
    </div>
  );
}
