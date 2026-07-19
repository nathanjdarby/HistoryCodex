import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  books,
  pointsLedger,
  readingSessions,
  userPointCaps,
  userStats,
  users,
  verificationQueue,
} from "@/db/schema";
import { ApiError } from "@/lib/api-utils";
import { recordCapUsage } from "@/lib/server/anti-cheat/caps";
import { unlockCampaignMilestones } from "@/lib/server/campaigns";
import { creditPoints } from "@/lib/server/era-points";
import { getGameRules } from "@/lib/server/game-rules";
import { getUserStats } from "@/lib/server/stats";

export type VerificationQueueItem = {
  id: number;
  userId: number;
  userEmail: string;
  sessionId: number | null;
  reason: string;
  payload: Record<string, unknown>;
  status: string;
  createdAt: Date;
  bookTitle: string | null;
  bookId: number | null;
  sessionPagesLogged: number | null;
  sessionActiveSeconds: number | null;
  velocityScore: number | null;
  flagReason: string | null;
};

export async function countPendingVerifications(): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(verificationQueue)
    .where(eq(verificationQueue.status, "pending"));
  return Number(rows[0]?.count ?? 0);
}

export async function listPendingVerifications(): Promise<VerificationQueueItem[]> {
  const rows = await db
    .select({
      id: verificationQueue.id,
      userId: verificationQueue.userId,
      userEmail: users.email,
      sessionId: verificationQueue.sessionId,
      reason: verificationQueue.reason,
      payload: verificationQueue.payload,
      status: verificationQueue.status,
      createdAt: verificationQueue.createdAt,
    })
    .from(verificationQueue)
    .innerJoin(users, eq(verificationQueue.userId, users.id))
    .where(eq(verificationQueue.status, "pending"))
    .orderBy(desc(verificationQueue.createdAt));

  return Promise.all(
    rows.map(async (row) => {
      const payload = JSON.parse(row.payload) as Record<string, unknown>;
      let bookTitle: string | null = null;
      let bookId = typeof payload.bookId === "number" ? payload.bookId : null;
      let sessionPagesLogged: number | null = null;
      let sessionActiveSeconds: number | null = null;
      let velocityScore: number | null = null;
      let flagReason: string | null = null;

      if (row.sessionId != null) {
        const [session] = await db
          .select()
          .from(readingSessions)
          .where(eq(readingSessions.id, row.sessionId));
        if (session) {
          bookId = session.bookId;
          sessionPagesLogged = session.pagesLogged;
          sessionActiveSeconds = session.activeSeconds;
          velocityScore = session.velocityScore;
          flagReason = session.flagReason;
        }
      }

      if (bookId != null) {
        const [book] = await db.select().from(books).where(eq(books.id, bookId));
        bookTitle = book?.title ?? null;
      }

      return {
        ...row,
        payload,
        bookTitle,
        bookId,
        sessionPagesLogged,
        sessionActiveSeconds,
        velocityScore,
        flagReason,
      };
    }),
  );
}

type ApprovalPayload = {
  allowedPoints?: number;
  bookId?: number;
  eraId?: number | null;
  milestonesCrossed?: number[];
};

export async function approveVerification(queueId: number, adminUserId: number) {
  const [item] = await db.select().from(verificationQueue).where(eq(verificationQueue.id, queueId));
  if (!item) throw new ApiError(404, "Queue item not found");
  if (item.status !== "pending") throw new ApiError(400, "Item already reviewed");

  const payload = JSON.parse(item.payload) as ApprovalPayload;
  const allowedPoints = payload.allowedPoints ?? 0;
  let bookId = payload.bookId ?? null;
  let eraId = payload.eraId ?? null;
  const milestonesCrossed = payload.milestonesCrossed ?? [];

  if (item.sessionId != null) {
    const [session] = await db
      .select()
      .from(readingSessions)
      .where(eq(readingSessions.id, item.sessionId));
    if (session) {
      bookId = session.bookId;
      const [book] = await db.select().from(books).where(eq(books.id, session.bookId));
      eraId = book?.eraId ?? eraId;
    }
  }

  if (allowedPoints > 0) {
    await creditPoints(item.userId, eraId ?? null, allowedPoints);
    await recordCapUsage(item.userId, allowedPoints);

    if (bookId != null && milestonesCrossed.length > 0) {
      const perMilestone = Math.floor(allowedPoints / milestonesCrossed.length);
      for (const milestone of milestonesCrossed) {
        await db
          .update(pointsLedger)
          .set({ status: "settled", points: perMilestone })
          .where(
            and(
              eq(pointsLedger.userId, item.userId),
              eq(pointsLedger.bookId, bookId),
              eq(pointsLedger.type, `milestone_${milestone}` as typeof pointsLedger.$inferSelect.type),
              eq(pointsLedger.status, "held"),
            ),
          );
      }
    }

    if (milestonesCrossed.includes(100)) {
      const stats = await getUserStats(item.userId);
      await db
        .update(userStats)
        .set({ booksFinished: stats.booksFinished + 1, updatedAt: new Date() })
        .where(eq(userStats.userId, item.userId));
    }

    await unlockCampaignMilestones(item.userId, eraId, milestonesCrossed);
  }

  const [caps] = await db
    .select()
    .from(userPointCaps)
    .where(eq(userPointCaps.userId, item.userId));
  if (caps) {
    const rules = await getGameRules();
    await db
      .update(userPointCaps)
      .set({
        trustScore: Math.min(100, caps.trustScore + rules.trustGainOnApprove),
        updatedAt: new Date(),
      })
      .where(eq(userPointCaps.userId, item.userId));
  }

  const [updated] = await db
    .update(verificationQueue)
    .set({
      status: "approved",
      reviewedBy: adminUserId,
      reviewedAt: new Date(),
    })
    .where(eq(verificationQueue.id, queueId))
    .returning();

  return updated;
}

export async function rejectVerification(queueId: number, adminUserId: number) {
  const [item] = await db.select().from(verificationQueue).where(eq(verificationQueue.id, queueId));
  if (!item) throw new ApiError(404, "Queue item not found");
  if (item.status !== "pending") throw new ApiError(400, "Item already reviewed");

  const payload = JSON.parse(item.payload) as ApprovalPayload;
  const milestonesCrossed = payload.milestonesCrossed ?? [];

  if (item.sessionId != null && milestonesCrossed.length > 0) {
    const [session] = await db
      .select()
      .from(readingSessions)
      .where(eq(readingSessions.id, item.sessionId));
    if (session) {
      for (const milestone of milestonesCrossed) {
        await db
          .update(pointsLedger)
          .set({ status: "reversed", points: 0 })
          .where(
            and(
              eq(pointsLedger.userId, item.userId),
              eq(pointsLedger.bookId, session.bookId),
              eq(pointsLedger.type, `milestone_${milestone}` as typeof pointsLedger.$inferSelect.type),
              eq(pointsLedger.status, "held"),
            ),
          );
      }
    }
  }

  const [updated] = await db
    .update(verificationQueue)
    .set({
      status: "rejected",
      reviewedBy: adminUserId,
      reviewedAt: new Date(),
    })
    .where(eq(verificationQueue.id, queueId))
    .returning();

  return updated;
}
