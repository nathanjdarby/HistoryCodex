import { and, eq, like, sql } from "drizzle-orm";
import { db } from "@/db";
import { books, pointsLedger, userStats } from "@/db/schema";
import { ApiError } from "@/lib/api-utils";
import { getBook } from "@/lib/server/books";
import { creditPoints } from "@/lib/server/era-points";
import { unlockCampaignMilestones } from "@/lib/server/campaigns";
import { getGameRules } from "@/lib/server/game-rules";
import { getUserStats } from "@/lib/server/stats";

type MilestoneType = `milestone_${number}`;

export async function updateBookProgress(userId: number, bookId: number, currentPage: number) {
  const rules = await getGameRules();
  const book = await getBook(bookId, userId);
  if (currentPage < 0 || currentPage > book.totalPages) {
    throw new ApiError(400, `currentPage must be between 0 and ${book.totalPages}`);
  }

  const pct = Math.floor((currentPage / book.totalPages) * 100);
  const now = new Date();

  const statusUpdate: Partial<typeof books.$inferInsert> = { currentPage, updatedAt: now };
  if (book.status === "to_read" && currentPage > 0) {
    statusUpdate.status = "reading";
    statusUpdate.startedAt = now;
  }
  if (currentPage >= book.totalPages) {
    statusUpdate.status = "finished";
    statusUpdate.finishedAt = now;
  }

  const [updatedRow] = await db
    .update(books)
    .set(statusUpdate)
    .where(eq(books.id, bookId))
    .returning();

  const updatedBook = { ...book, ...updatedRow };

  const awardedMilestones: MilestoneType[] = [];

  for (const milestone of rules.milestones) {
    if (pct < milestone) continue;
    const type = `milestone_${milestone}` as MilestoneType;

    const result = await db.execute(sql`
      insert into points_ledger (user_id, book_id, era_id, type, points)
      values (${userId}, ${bookId}, ${book.eraId}, ${type}, ${rules.pointsPerMilestone})
      on conflict (book_id, type) where type like 'milestone_%' do nothing
      returning id
    `);

    if (result.length > 0) {
      awardedMilestones.push(type);
    }
  }

  let campaignNodesUnlocked: string[] = [];

  if (awardedMilestones.length > 0) {
    const earned = awardedMilestones.length * rules.pointsPerMilestone;
    await creditPoints(userId, book.eraId, earned);

    const milestonesCrossed = awardedMilestones.map((t) => Number(t.replace("milestone_", "")));
    campaignNodesUnlocked = (
      await unlockCampaignMilestones(userId, book.eraId, milestonesCrossed)
    ).newlyUnlocked;

    if (
      rules.milestones.includes(100) &&
      awardedMilestones.includes("milestone_100" as MilestoneType)
    ) {
      const stats = await getUserStats(userId);
      await db
        .update(userStats)
        .set({
          booksFinished: stats.booksFinished + 1,
          updatedAt: new Date(),
        })
        .where(eq(userStats.userId, userId));
    }
  }

  const stats = await getUserStats(userId);
  return {
    book: updatedBook,
    awardedMilestones,
    awardedPoints: awardedMilestones.length * rules.pointsPerMilestone,
    pointsPerMilestone: rules.pointsPerMilestone,
    campaignNodesUnlocked,
    stats,
  };
}

export async function getBookMilestones(userId: number, bookId: number) {
  return db
    .select()
    .from(pointsLedger)
    .where(
      and(
        eq(pointsLedger.userId, userId),
        eq(pointsLedger.bookId, bookId),
        like(pointsLedger.type, "milestone_%"),
      ),
    );
}
