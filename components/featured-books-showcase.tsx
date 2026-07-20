import Image from "next/image";
import Link from "next/link";
import { BookOpen, Library } from "lucide-react";
import type { FeaturedCatalogBook } from "@/lib/server/catalog-books";

function CatalogBookTile({ book, marketing }: { book: FeaturedCatalogBook; marketing?: boolean }) {
  return (
    <article
      title={book.title}
      className={`relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-neutral-900 transition-transform duration-300 hover:-translate-y-1 ${
        marketing ? "home-book-cover" : "shadow-md ring-1 ring-black/10 dark:ring-white/10 hover:shadow-lg"
      }`}
    >
      {book.coverUrl ? (
        <Image
          src={book.coverUrl}
          alt={book.title}
          fill
          sizes="(max-width: 640px) 18vw, 140px"
          className="object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-surface text-subtle">
          <BookOpen size={28} />
        </div>
      )}
    </article>
  );
}

export function FeaturedBooksShowcase({
  books,
  totalCount,
  marketing = false,
}: {
  books: FeaturedCatalogBook[];
  totalCount: number;
  marketing?: boolean;
}) {
  if (books.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-5 gap-2 sm:gap-4">
        {books.slice(0, 5).map((book) => (
          <CatalogBookTile key={book.id} book={book} marketing={marketing} />
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 text-center">
        {totalCount > books.length && (
          <p className={`text-sm ${marketing ? "text-stone-400" : "text-muted"}`}>
            {totalCount} title{totalCount === 1 ? "" : "s"} in the catalog — and more on the way.
          </p>
        )}
        {totalCount <= books.length && totalCount > 0 && (
          <p className={`text-sm ${marketing ? "text-stone-400" : "text-muted"}`}>
            More titles are added to the catalog as we grow.
          </p>
        )}
        <p
          className={`max-w-xl text-sm leading-relaxed ${
            marketing ? "text-stone-400" : "text-muted"
          }`}
        >
          The catalog is a reading companion — match what you&apos;re already reading in any format,
          then log pages to unlock points and cards. We don&apos;t host or sell the book itself.
        </p>
        <p
          className={`max-w-lg rounded-lg px-4 py-3 text-sm leading-relaxed ${
            marketing
              ? "home-panel text-stone-400"
              : "border border-border/80 bg-surface/40 text-muted"
          }`}
        >
          Don&apos;t see your title yet? Once you&apos;re signed in, request a book to be added to
          the catalog so you can track it before your next reading session.
        </p>
        <Link
          href="/login?next=/books/browse"
          className={
            marketing
              ? "home-btn-secondary"
              : "inline-flex items-center gap-2 rounded-lg border border-border bg-surface/60 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-hover"
          }
        >
          <Library size={16} />
          Sign in to browse the catalog
        </Link>
      </div>
    </>
  );
}
