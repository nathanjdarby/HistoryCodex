import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { books, catalogBooks, eras, timelineEntries } from "@/db/schema";
import { ApiError } from "@/lib/api-utils";
import { countCatalogBookCards } from "@/lib/server/catalog-book-cards";

export const catalogBookInputSchema = z.object({
  title: z.string().min(1).max(300),
  author: z.string().max(300).nullable().optional(),
  summary: z.string().max(2000).nullable().optional(),
  isbn: z.string().max(40).nullable().optional(),
  openLibraryId: z.string().max(120).nullable().optional(),
  coverUrl: z.string().max(500).nullable().optional(),
  totalPages: z.number().int().positive(),
  wordCount: z.number().int().positive().nullable().optional(),
  wordsPerPage: z.number().int().positive().nullable().optional(),
  eraId: z.number().int().nullable().optional(),
  active: z.boolean().optional(),
});

export type CatalogBookInput = z.infer<typeof catalogBookInputSchema>;

export type CatalogBookRow = typeof catalogBooks.$inferSelect;

export type CatalogBookWithEra = CatalogBookRow & {
  eraName: string | null;
};

function catalogSelectFields() {
  return {
    id: catalogBooks.id,
    title: catalogBooks.title,
    author: catalogBooks.author,
    isbn: catalogBooks.isbn,
    openLibraryId: catalogBooks.openLibraryId,
    coverUrl: catalogBooks.coverUrl,
    summary: catalogBooks.summary,
    totalPages: catalogBooks.totalPages,
    wordCount: catalogBooks.wordCount,
    wordsPerPage: catalogBooks.wordsPerPage,
    eraId: catalogBooks.eraId,
    active: catalogBooks.active,
    createdAt: catalogBooks.createdAt,
    updatedAt: catalogBooks.updatedAt,
    eraName: eras.name,
  };
}

export async function listCatalogBooks(options?: { activeOnly?: boolean }) {
  const rows = await db
    .select(catalogSelectFields())
    .from(catalogBooks)
    .leftJoin(eras, eq(catalogBooks.eraId, eras.id))
    .where(options?.activeOnly ? eq(catalogBooks.active, true) : undefined)
    .orderBy(desc(catalogBooks.createdAt));

  const counts = await countCatalogBookCards(rows.map((row) => row.id));
  return rows.map((row) => ({
    ...row,
    cardCount: counts.get(row.id) ?? 0,
  }));
}

export async function getCatalogBook(id: number) {
  const [row] = await db
    .select(catalogSelectFields())
    .from(catalogBooks)
    .leftJoin(eras, eq(catalogBooks.eraId, eras.id))
    .where(eq(catalogBooks.id, id));
  if (!row) throw new ApiError(404, "Catalog book not found");
  return row;
}

async function assertEraExists(eraId: number) {
  const [era] = await db.select().from(eras).where(eq(eras.id, eraId));
  if (!era) throw new ApiError(400, "Era not found");
}

export async function createCatalogBook(input: CatalogBookInput) {
  if (input.eraId != null) await assertEraExists(input.eraId);

  const [created] = await db
    .insert(catalogBooks)
    .values({
      ...input,
      active: input.active ?? true,
      updatedAt: new Date(),
    })
    .returning();

  return getCatalogBook(created.id);
}

export async function updateCatalogBook(id: number, input: Partial<CatalogBookInput>) {
  await getCatalogBook(id);
  if (input.eraId != null) await assertEraExists(input.eraId);

  await db
    .update(catalogBooks)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(catalogBooks.id, id));

  await syncUserBooksFromCatalog(id);
  return getCatalogBook(id);
}

export async function deleteCatalogBook(id: number) {
  await getCatalogBook(id);
  const [inUse] = await db.select({ id: books.id }).from(books).where(eq(books.catalogBookId, id));
  if (inUse) {
    throw new ApiError(400, "Cannot delete — users have this book in their library. Deactivate it instead.");
  }
  await db.delete(catalogBooks).where(eq(catalogBooks.id, id));
}

/** Snapshot catalog metadata for denormalized user book rows + timeline. */
export function snapshotFromCatalog(catalog: CatalogBookRow) {
  return {
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

function timelineSummaryForBook(book: { summary: string | null; author: string | null }) {
  const summary = book.summary?.trim();
  if (summary) return summary;
  if (book.author) return `by ${book.author}`;
  return null;
}

async function loadCatalogRow(id: number): Promise<CatalogBookRow> {
  const [catalog] = await db.select().from(catalogBooks).where(eq(catalogBooks.id, id));
  if (!catalog) throw new ApiError(404, "Catalog book not found");
  return catalog;
}

export async function syncUserBooksFromCatalog(catalogBookId: number) {
  const catalog = await loadCatalogRow(catalogBookId);
  const snapshot = snapshotFromCatalog(catalog);
  await db
    .update(books)
    .set({ ...snapshot, updatedAt: new Date() })
    .where(eq(books.catalogBookId, catalogBookId));

  const userBookRows = await db.select().from(books).where(eq(books.catalogBookId, catalogBookId));
  for (const userBook of userBookRows) {
    const [companionEntry] = await db
      .select()
      .from(timelineEntries)
      .where(eq(timelineEntries.bookId, userBook.id));
    if (companionEntry) {
      await db
        .update(timelineEntries)
        .set({
          title: catalog.title,
          summary: timelineSummaryForBook(catalog),
          eraId: catalog.eraId,
          imageUrl: catalog.coverUrl,
          updatedAt: new Date(),
        })
        .where(eq(timelineEntries.id, companionEntry.id));
    }
  }
}
