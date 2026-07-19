import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { books, catalogBooks, eras, pointsLedger, timelineEntries, userCharacters } from "@/db/schema";
import { ApiError } from "@/lib/api-utils";
import {
  snapshotFromCatalog,
  type CatalogBookRow,
} from "@/lib/server/catalog-books";
import { assertUserHasEra } from "@/lib/server/user-eras";

export const addToLibrarySchema = z.object({
  catalogBookId: z.number().int().positive(),
});

function timelineSummaryForBook(book: { summary: string | null; author: string | null }) {
  const summary = book.summary?.trim();
  if (summary) return summary;
  if (book.author) return `by ${book.author}`;
  return null;
}

function mergeBookRow(
  userBook: typeof books.$inferSelect,
  catalog: CatalogBookRow,
) {
  return {
    ...userBook,
    catalogBookId: catalog.id,
    title: catalog.title,
    author: catalog.author,
    isbn: catalog.isbn,
    openLibraryId: catalog.openLibraryId,
    coverUrl: catalog.coverUrl,
    summary: catalog.summary,
    totalPages: catalog.totalPages,
    wordCount: catalog.wordCount,
    wordsPerPage: catalog.wordsPerPage,
    eraId: catalog.eraId,
  };
}

async function loadCatalogRow(id: number): Promise<CatalogBookRow> {
  const [catalog] = await db.select().from(catalogBooks).where(eq(catalogBooks.id, id));
  if (!catalog) throw new ApiError(404, "Catalog book not found");
  return catalog;
}

export async function listBooks(userId: number) {
  const rows = await db
    .select({ userBook: books, catalog: catalogBooks })
    .from(books)
    .innerJoin(catalogBooks, eq(books.catalogBookId, catalogBooks.id))
    .where(eq(books.userId, userId))
    .orderBy(desc(books.createdAt));

  return rows.map(({ userBook, catalog }) => mergeBookRow(userBook, catalog));
}

export async function getBook(id: number, userId?: number) {
  const [row] = await db
    .select({ userBook: books, catalog: catalogBooks })
    .from(books)
    .innerJoin(catalogBooks, eq(books.catalogBookId, catalogBooks.id))
    .where(eq(books.id, id));

  if (!row) throw new ApiError(404, "Book not found");
  if (userId !== undefined && row.userBook.userId !== userId) {
    throw new ApiError(404, "Book not found");
  }

  return mergeBookRow(row.userBook, row.catalog);
}

export async function addBookToLibrary(userId: number, catalogBookId: number) {
  const catalog = await loadCatalogRow(catalogBookId);
  if (!catalog.active) {
    throw new ApiError(400, "This book is not available on the platform.");
  }

  await assertUserHasEra(userId, catalog.eraId);

  const [existing] = await db
    .select()
    .from(books)
    .where(and(eq(books.userId, userId), eq(books.catalogBookId, catalogBookId)));
  if (existing) {
    throw new ApiError(409, "This book is already in your library.");
  }

  const snapshot = snapshotFromCatalog(catalog);

  const [book] = await db
    .insert(books)
    .values({
      userId,
      catalogBookId,
      ...snapshot,
      status: "to_read",
    })
    .returning();

  let year = new Date().getFullYear();
  if (catalog.eraId) {
    const [era] = await db.select().from(eras).where(eq(eras.id, catalog.eraId));
    if (era) year = era.startYear;
  }

  await db.insert(timelineEntries).values({
    kind: "book",
    title: catalog.title,
    summary: timelineSummaryForBook(catalog),
    year,
    eraId: catalog.eraId,
    bookId: book.id,
    imageUrl: catalog.coverUrl,
  });

  return mergeBookRow(book, catalog);
}

export async function removeBookFromLibrary(id: number, userId?: number) {
  if (userId !== undefined) await getBook(id, userId);
  else await getBook(id);

  await db.delete(timelineEntries).where(eq(timelineEntries.bookId, id));
  await db.delete(pointsLedger).where(eq(pointsLedger.bookId, id));
  await db
    .update(userCharacters)
    .set({ sourceBookId: null })
    .where(eq(userCharacters.sourceBookId, id));
  await db.delete(books).where(eq(books.id, id));
}

export const deleteBook = removeBookFromLibrary;

export async function listUserCatalogBookIds(userId: number) {
  const rows = await db
    .select({ catalogBookId: books.catalogBookId })
    .from(books)
    .where(eq(books.userId, userId));
  return new Set(rows.map((r) => r.catalogBookId));
}
