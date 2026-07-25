import { and, eq, like, sql } from "drizzle-orm";
import { db } from "@/db";
import { books, pointsLedger, userStats } from "@/db/schema";
import { ApiError } from "@/lib/api-utils";
import {
  getProgressNumerator,
  getProgressPercent,
  statusPatchFromProgress,
} from "@/lib/book-progress";
import { validateProgressValue } from "@/lib/server/book-progress-validation";
import { getBook } from "@/lib/server/books";
import { creditPoints } from "@/lib/server/era-points";
import { unlockCampaignMilestones } from "@/lib/server/campaigns";
import { getGameRules } from "@/lib/server/game-rules";
import { getUserStats } from "@/lib/server/stats";

type MilestoneType = `milestone_${number}`;

export type BookProgressInput = {
  currentPage?: number;
  currentPositionSeconds?: number;
};

export async function updateBookProgress(
  userId: number,
  bookId: number,
  input: BookProgressInput,
) {
  const rules = await getGameRules();
  const book = await getBook(bookId, userId);

  let numerator: number;
  let fieldPatch: Partial<{ currentPage: number; currentPositionSeconds: number }>;

  if (book.consumptionFormat === "audiobook") {
    if (input.currentPositionSeconds === undefined) {
      throw new ApiError(400, "currentPositionSeconds is required for audiobook progress");
    }
    validateProgressValue(book, input.currentPositionSeconds);
    numerator = input.currentPositionSeconds;
    fieldPatch = { currentPositionSeconds: input.currentPositionSeconds };
  } else {
    if (input.currentPage === undefined) {
      throw new ApiError(400, "currentPage is required for print and e-reader progress");
    }
    validateProgressValue(book, input.currentPage);
    numerator = input.currentPage;
    fieldPatch = { currentPage: input.currentPage };
  }

  const pct = getProgressPercent({ ...book, ...fieldPatch });
  const statusUpdate = statusPatchFromProgress(book, numerator, fieldPatch);

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

/** Credit any legacy held milestone rows — reading awards are now instant on good faith. */
export async function settleHeldBookMilestones(userId: number, bookId: number) {
  const heldRows = await db
    .select()
    .from(pointsLedger)
    .where(
      and(
        eq(pointsLedger.userId, userId),
        eq(pointsLedger.bookId, bookId),
        eq(pointsLedger.status, "held"),
        like(pointsLedger.type, "milestone_%"),
      ),
    );

  if (heldRows.length === 0) return;

  const book = await getBook(bookId, userId);
  const rules = await getGameRules();

  for (const row of heldRows) {
    const award = row.pointsRequested ?? rules.pointsPerMilestone;
    if (award <= 0) continue;

    await db
      .update(pointsLedger)
      .set({ status: "settled", points: award })
      .where(eq(pointsLedger.id, row.id));
    await creditPoints(userId, book.eraId, award);
  }
}

export function splitBookMilestones(rows: Awaited<ReturnType<typeof getBookMilestones>>) {
  const earnedMilestones: number[] = [];

  for (const row of rows) {
    const value = Number(row.type.replace("milestone_", ""));
    if (!Number.isFinite(value)) continue;
    if (row.status === "settled" && row.points > 0) {
      earnedMilestones.push(value);
    } else if (row.status === "held") {
      earnedMilestones.push(value);
    }
  }

  earnedMilestones.sort((a, b) => a - b);
  return { earnedMilestones, pendingMilestones: [] as number[] };
}

export function getCurrentProgressValue(book: Awaited<ReturnType<typeof getBook>>) {
  return getProgressNumerator(book);
}
