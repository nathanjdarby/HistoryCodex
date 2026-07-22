import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { users } from "./schema";
import { ApiError } from "@/lib/api-utils";
import { addBookToLibrary, listBooks } from "@/lib/server/books";
import { updateBookProgress } from "@/lib/server/points";
import { setUserTimelines } from "@/lib/server/user-eras";
import { getUserStats } from "@/lib/server/stats";

const TEST_EMAIL = "campaign-test@example.com";
const TEST_PASSWORD = "password";

/** Catalog book id → target reading progress (0–100). */
const BOOK_PROGRESS: Record<number, number> = {
  1: 50, // Revolusi — Indonesia (red)
  2: 100, // My Neighbour, The Dictator — Indonesia (red), completes map
  5: 75, // The First King Of England — Anglo-Saxon (green)
  3: 25, // The Wager — Georgian Britain (blue)
};

async function main() {
  let [user] = await db.select().from(users).where(eq(users.email, TEST_EMAIL));

  if (!user) {
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
    [user] = await db
      .insert(users)
      .values({ email: TEST_EMAIL, passwordHash, role: "user" })
      .returning();
    await getUserStats(user.id);
    console.log(`Created test user: ${TEST_EMAIL} / ${TEST_PASSWORD}`);
  } else {
    console.log(`Using existing test user: ${TEST_EMAIL}`);
  }

  await setUserTimelines(user.id, [14, 2, 6]); // Indonesia, Anglo-Saxon, Georgian Britain

  for (const [catalogBookIdStr, pct] of Object.entries(BOOK_PROGRESS)) {
    const catalogBookId = Number(catalogBookIdStr);
    let book;
    try {
      book = await addBookToLibrary(user.id, { catalogBookId, consumptionFormat: "print" });
      console.log(`Added to library: ${book.title}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const books = await listBooks(user.id);
        book = books.find((b) => b.catalogBookId === catalogBookId);
        if (!book) throw err;
        console.log(`Already in library: ${book.title}`);
      } else {
        throw err;
      }
    }

    const targetPage = Math.round((pct / 100) * book.totalPages);
    const result = await updateBookProgress(user.id, book.id, { currentPage: targetPage });
    console.log(
      `  → ${pct}% (${targetPage}/${book.totalPages} pages), milestones: ${result.awardedMilestones.join(", ") || "none"}`,
    );
  }

  console.log("\nLog in at /login with:");
  console.log(`  Email:    ${TEST_EMAIL}`);
  console.log(`  Password: ${TEST_PASSWORD}`);
  console.log("\nThen visit /campaigns — Indonesia should show a fully lit red map.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
