import { randomUUID } from "node:crypto";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { books, readingSessions, userStats } from "@/db/schema";
import { ApiError } from "@/lib/api-utils";
import {
  applyPointCaps,
  decayTrustScore,
  enqueueVerification,
  getOrResetCaps,
  recordAntiCheatEvent,
  recordCapUsage,
} from "@/lib/server/anti-cheat/caps";
import { ANTI_CHEAT } from "@/lib/server/anti-cheat/config";
import { evaluateReadingVelocity, type VelocityRules } from "@/lib/server/anti-cheat/velocity";
import { creditPoints } from "@/lib/server/era-points";
import { unlockCampaignMilestones } from "@/lib/server/campaigns";
import { getBook } from "@/lib/server/books";
import { getGameRules } from "@/lib/server/game-rules";
import { getUserStats } from "@/lib/server/stats";

type MilestoneType = `milestone_${number}`;

function pct(currentPage: number, totalPages: number) {
  if (totalPages <= 0) return 0;
  return Math.floor((currentPage / totalPages) * 100);
}

function wordsPerPageForBook(book: {
  wordsPerPage: number | null;
  wordCount: number | null;
  totalPages: number;
}) {
  if (book.wordsPerPage != null) return book.wordsPerPage;
  if (book.wordCount != null && book.totalPages > 0) {
    return Math.round(book.wordCount / book.totalPages);
  }
  return null;
}

function statusFromPage(currentPage: number, totalPages: number, existing: typeof books.$inferSelect) {
  const patch: Partial<typeof books.$inferInsert> = { currentPage, updatedAt: new Date() };
  if (existing.status === "to_read" && currentPage > 0) {
    patch.status = "reading";
    patch.startedAt = existing.startedAt ?? new Date();
  }
  if (currentPage >= totalPages) {
    patch.status = "finished";
    patch.finishedAt = new Date();
  }
  return patch;
}

async function assertSessionToken(sessionId: number, userId: number, clientToken: string) {
  const [session] = await db
    .select()
    .from(readingSessions)
    .where(and(eq(readingSessions.id, sessionId), eq(readingSessions.userId, userId)));
  if (!session) throw new ApiError(404, "Session not found");
  if (session.clientToken !== clientToken) throw new ApiError(403, "Invalid session token");
  return session;
}

export async function getActiveSessionForBook(userId: number, bookId: number) {
  const [session] = await db
    .select()
    .from(readingSessions)
    .where(
      and(
        eq(readingSessions.userId, userId),
        eq(readingSessions.bookId, bookId),
        inArray(readingSessions.status, ["active", "paused"]),
      ),
    )
    .orderBy(readingSessions.id);
  return session ?? null;
}

export async function startReadingSession(userId: number, bookId: number) {
  const book = await getBook(bookId, userId);
  const now = new Date();

  const recentStarts = await db
    .select({ count: sql<number>`count(*)` })
    .from(readingSessions)
    .where(
      and(eq(readingSessions.userId, userId), gte(readingSessions.createdAt, new Date(Date.now() - 3600_000))),
    );
  if (Number(recentStarts[0]?.count ?? 0) >= ANTI_CHEAT.MAX_SESSION_STARTS_PER_HOUR) {
    throw new ApiError(429, "Too many reading sessions started — try again later.");
  }

  const activeCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(readingSessions)
    .where(and(eq(readingSessions.userId, userId), eq(readingSessions.status, "active")));
  if (Number(activeCount[0]?.count ?? 0) >= ANTI_CHEAT.MAX_CONCURRENT_ACTIVE_SESSIONS) {
    throw new ApiError(400, "Finish or pause your other active sessions first.");
  }

  const existing = await getActiveSessionForBook(userId, bookId);
  if (existing) return existing;

  const [session] = await db
    .insert(readingSessions)
    .values({
      userId,
      bookId,
      startPage: book.currentPage,
      startTime: now,
      lastHeartbeat: now,
      clientToken: randomUUID(),
      status: "active",
      source: "timer",
    })
    .returning();

  await recordAntiCheatEvent(userId, "session_start", session.id, { bookId });
  return session;
}

export async function heartbeatReadingSession(
  userId: number,
  bookId: number,
  sessionId: number,
  clientToken: string,
  tabVisible: boolean,
) {
  const session = await assertSessionToken(sessionId, userId, clientToken);
  if (session.bookId !== bookId) throw new ApiError(400, "Session does not match book");
  if (session.status !== "active") return session;

  const now = new Date();
  const gapSec = (now.getTime() - session.lastHeartbeat.getTime()) / 1000;

  if (gapSec > ANTI_CHEAT.MAX_HEARTBEAT_GAP_SEC) {
    const [updated] = await db
      .update(readingSessions)
      .set({ lastHeartbeat: now, updatedAt: now })
      .where(eq(readingSessions.id, sessionId))
      .returning();
    return updated;
  }

  const increment = tabVisible
    ? Math.min(gapSec, ANTI_CHEAT.MAX_HEARTBEAT_INCREMENT_SEC)
    : 0;

  const [updated] = await db
    .update(readingSessions)
    .set({
      activeSeconds: session.activeSeconds + Math.floor(increment),
      lastHeartbeat: now,
      updatedAt: now,
    })
    .where(eq(readingSessions.id, sessionId))
    .returning();

  return updated;
}

export async function pauseReadingSession(
  userId: number,
  bookId: number,
  sessionId: number,
  clientToken: string,
) {
  const session = await assertSessionToken(sessionId, userId, clientToken);
  if (session.bookId !== bookId) throw new ApiError(400, "Session does not match book");
  if (session.status !== "active") return session;

  const [updated] = await db
    .update(readingSessions)
    .set({ status: "paused", updatedAt: new Date() })
    .where(eq(readingSessions.id, sessionId))
    .returning();
  return updated;
}

export async function resumeReadingSession(
  userId: number,
  bookId: number,
  sessionId: number,
  clientToken: string,
) {
  const session = await assertSessionToken(sessionId, userId, clientToken);
  if (session.bookId !== bookId) throw new ApiError(400, "Session does not match book");
  if (session.status !== "paused") return session;

  const now = new Date();
  const [updated] = await db
    .update(readingSessions)
    .set({ status: "active", lastHeartbeat: now, updatedAt: now })
    .where(eq(readingSessions.id, sessionId))
    .returning();
  return updated;
}

export async function finalizeReadingSession(
  userId: number,
  bookId: number,
  sessionId: number,
  clientToken: string,
  endPage: number,
) {
  const session = await assertSessionToken(sessionId, userId, clientToken);
  if (session.bookId !== bookId) throw new ApiError(400, "Session does not match book");
  if (session.status !== "active" && session.status !== "paused") {
    throw new ApiError(400, "Session is already closed");
  }

  const book = await getBook(bookId, userId);
  const rules = await getGameRules();
  const velocityRules: VelocityRules = {
    minSecondsPerPage: rules.minSecondsPerPage,
    softSecondsPerPage: rules.softSecondsPerPage,
    maxWpm: rules.maxWpm,
    softWpm: rules.softWpm,
    defaultWordsPerPage: ANTI_CHEAT.DEFAULT_WORDS_PER_PAGE,
  };
  if (endPage < session.startPage) {
    throw new ApiError(400, "End page cannot be before session start page");
  }
  if (endPage > book.totalPages) {
    throw new ApiError(400, `End page must be at most ${book.totalPages}`);
  }

  const pagesLogged = endPage - session.startPage;
  const activeSeconds = session.activeSeconds;
  const velocity = evaluateReadingVelocity(
    {
      pagesLogged,
      activeSeconds,
      wordsPerPage: wordsPerPageForBook(book),
      source: session.source,
    },
    velocityRules,
  );

  const oldPct = pct(book.currentPage, book.totalPages);
  const newPct = pct(endPage, book.totalPages);
  const milestonesCrossed = rules.milestones.filter((m) => oldPct < m && newPct >= m);
  const pointsPerMilestone = Math.floor(rules.pointsPerMilestone * velocity.velocityScore);
  const pointsRequested = milestonesCrossed.length * pointsPerMilestone;

  const caps = await getOrResetCaps(userId);
  const { allowedPoints, overflowPoints } = applyPointCaps(pointsRequested, caps);

  const needsQueue =
    velocity.route === "verification_queue" ||
    overflowPoints > 0 ||
    caps.trustScore < rules.minTrustForInstantAward;

  const now = new Date();
  const velocityScoreInt = Math.round(velocity.velocityScore * 100);
  const pagesPerMinX100 = Math.round(velocity.pagesPerMin * 100);

  const [updatedSession] = await db
    .update(readingSessions)
    .set({
      status: velocity.flagged ? "flagged" : "completed",
      endPage,
      pagesLogged,
      endTime: now,
      pagesPerMinX100,
      wpmEstimate: velocity.wpmEstimate != null ? Math.round(velocity.wpmEstimate) : null,
      velocityScore: velocityScoreInt,
      flagReason: velocity.flagReason,
      updatedAt: now,
    })
    .where(eq(readingSessions.id, sessionId))
    .returning();

  const bookPatch = statusFromPage(endPage, book.totalPages, book);
  const [updatedBook] = await db
    .update(books)
    .set(bookPatch)
    .where(eq(books.id, bookId))
    .returning();

  const awardedMilestones: MilestoneType[] = [];
  let awardedPoints = 0;
  let pendingPoints = 0;
  let campaignNodesUnlocked: string[] = [];

  const pointsPerMilestoneAward =
    !needsQueue && pointsPerMilestone > 0
      ? Math.min(pointsPerMilestone, Math.floor(allowedPoints / Math.max(milestonesCrossed.length, 1)))
      : 0;

  for (const milestone of milestonesCrossed) {
    const type = `milestone_${milestone}` as MilestoneType;
    const ledgerPoints = needsQueue ? 0 : pointsPerMilestoneAward;

    const result = db.run(sql`
      insert into points_ledger (
        user_id, book_id, era_id, session_id, type, points, points_requested, status, metadata
      )
      values (
        ${userId}, ${bookId}, ${book.eraId}, ${sessionId}, ${type},
        ${ledgerPoints},
        ${pointsPerMilestone},
        ${needsQueue ? "held" : "settled"},
        ${JSON.stringify({ velocityScore: velocity.velocityScore, flagReason: velocity.flagReason })}
      )
      on conflict (book_id, type) where type like 'milestone_%' do nothing
    `);

    if (result.changes > 0) {
      awardedMilestones.push(type);
    }
  }

  if (!needsQueue && allowedPoints > 0 && awardedMilestones.length > 0) {
    const actualAward = awardedMilestones.length * pointsPerMilestoneAward;
    await creditPoints(userId, book.eraId, actualAward);
    awardedPoints = actualAward;
    await recordCapUsage(userId, actualAward);

    if (
      rules.milestones.includes(100) &&
      awardedMilestones.includes("milestone_100" as MilestoneType)
    ) {
      const stats = await getUserStats(userId);
      await db
        .update(userStats)
        .set({ booksFinished: stats.booksFinished + 1, updatedAt: new Date() })
        .where(eq(userStats.userId, userId));
    }

    campaignNodesUnlocked = (
      await unlockCampaignMilestones(userId, book.eraId, milestonesCrossed)
    ).newlyUnlocked;
  } else if (allowedPoints > 0) {
    pendingPoints = allowedPoints;
    await enqueueVerification(userId, sessionId, needsQueue ? "velocity_or_trust" : "cap_overflow", {
      pointsRequested,
      allowedPoints,
      overflowPoints,
      velocity,
      milestonesCrossed,
      bookId,
      eraId: book.eraId,
    });
  }

  if (velocity.flagged) {
    await recordAntiCheatEvent(userId, "velocity_flag", sessionId, velocity);
    await decayTrustScore(userId);
  }

  if (overflowPoints > 0) {
    await enqueueVerification(userId, sessionId, "cap_overflow", { overflowPoints, allowedPoints });
  }

  const stats = await getUserStats(userId);

  return {
    session: updatedSession,
    book: updatedBook,
    awardedMilestones,
    awardedPoints,
    pendingPoints,
    campaignNodesUnlocked,
    velocity: {
      pagesPerMin: velocity.pagesPerMin,
      wpmEstimate: velocity.wpmEstimate,
      velocityScore: velocity.velocityScore,
      flagged: velocity.flagged,
      flagReason: velocity.flagReason,
      route: velocity.route,
    },
    stats,
  };
}
