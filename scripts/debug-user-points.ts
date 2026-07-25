import { eq, like, and } from "drizzle-orm";
import { db } from "../db/index";
import { books, pointsLedger, readingSessions, userStats, users } from "../db/schema";
import { getGameRules } from "../lib/server/game-rules";

const EMAIL = process.argv[2] ?? "nathan.darby@live.co.uk";

async function main() {
  const [user] = await db.select().from(users).where(eq(users.email, EMAIL));
  if (!user) {
    console.error("User not found:", EMAIL);
    process.exit(1);
  }

  const rules = await getGameRules();
  const [stats] = await db.select().from(userStats).where(eq(userStats.userId, user.id));

  console.log("User:", user.email, `#${user.id}`);
  console.log("Points balance:", stats?.pointsBalance ?? 0);
  console.log("Game rules milestones:", rules.milestones);
  console.log("Points per milestone:", rules.pointsPerMilestone);

  const userBooks = await db.select().from(books).where(eq(books.userId, user.id));
  console.log("\nBooks:", userBooks.length);

  for (const book of userBooks) {
    const pct =
      book.consumptionFormat === "audiobook"
        ? book.totalDurationSeconds
          ? Math.floor((book.currentPositionSeconds / book.totalDurationSeconds) * 100)
          : 0
        : book.totalPages
          ? Math.floor((book.currentPage / book.totalPages) * 100)
          : 0;

    const milestones = await db
      .select()
      .from(pointsLedger)
      .where(and(eq(pointsLedger.userId, user.id), eq(pointsLedger.bookId, book.id), like(pointsLedger.type, "milestone_%")));

    if (milestones.length === 0 && book.currentPage === 0 && book.currentPositionSeconds === 0) continue;

    console.log(`\n--- Book #${book.id} (${book.consumptionFormat}) page ${book.currentPage}/${book.totalPages} ~${pct}% ---`);
    for (const row of milestones) {
      console.log(
        `  ${row.type}: points=${row.points} requested=${row.pointsRequested} status=${row.status} session=${row.sessionId}`,
      );
    }

    const sessions = await db
      .select()
      .from(readingSessions)
      .where(and(eq(readingSessions.userId, user.id), eq(readingSessions.bookId, book.id)))
      .orderBy(readingSessions.createdAt);

    for (const s of sessions.slice(-3)) {
      console.log(
        `  session #${s.id} ${s.status} pagesLogged=${s.pagesLogged} velocity=${s.velocityScore} flag=${s.flagReason ?? "none"}`,
      );
    }
  }

  const recentLedger = await db
    .select()
    .from(pointsLedger)
    .where(eq(pointsLedger.userId, user.id))
    .orderBy(pointsLedger.createdAt)
    .limit(20);

  console.log("\nRecent ledger (last 20):");
  for (const row of recentLedger) {
    console.log(
      `  ${row.createdAt?.toISOString()} ${row.type} +${row.points} status=${row.status} book=${row.bookId}`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
