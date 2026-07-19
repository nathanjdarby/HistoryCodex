import { eq, isNull } from "drizzle-orm";
import { db } from "./index";
import { books, catalogBooks } from "./schema";
import { snapshotFromCatalog } from "../lib/server/catalog-books";

async function main() {
  const legacyRows = await db.select().from(books).where(isNull(books.catalogBookId));

  for (const row of legacyRows) {
    const [catalog] = await db
      .insert(catalogBooks)
      .values({
        title: row.title,
        author: row.author,
        isbn: row.isbn,
        openLibraryId: row.openLibraryId,
        coverUrl: row.coverUrl,
        summary: row.summary,
        totalPages: row.totalPages,
        wordCount: row.wordCount,
        wordsPerPage: row.wordsPerPage,
        eraId: row.eraId,
        active: true,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })
      .returning();

    await db.update(books).set({ catalogBookId: catalog.id }).where(eq(books.id, row.id));
  }

  console.log(`Backfilled catalog links for ${legacyRows.length} user book(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
