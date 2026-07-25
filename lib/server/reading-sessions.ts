import { randomUUID } from "node:crypto";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { books, readingSessions, userStats } from "@/db/schema";
import { ApiError } from "@/lib/api-utils";
import {
  getProgressNumerator,
  getProgressPercent,
  statusPatchFromProgress,
  wordsPerPageForBook,
} from "@/lib/book-progress";
import { validateProgressValue } from "@/lib/server/book-progress-validation";
import {
  applyPointCaps,
  getOrResetCaps,
  recordAntiCheatEvent,
  recordCapUsage,
} from "@/lib/server/anti-cheat/caps";
import { ANTI_CHEAT } from "@/lib/server/anti-cheat/config";
import { evaluateReadingVelocity, type VelocityRoute, type VelocityRules } from "@/lib/server/anti-cheat/velocity";
import { creditPoints } from "@/lib/server/era-points";
import { unlockCampaignMilestones } from "@/lib/server/campaigns";
import { getBook } from "@/lib/server/books";
import { getGameRules } from "@/lib/server/game-rules";
import { getUserStats } from "@/lib/server/stats";

type MilestoneType = `milestone_${number}`;

const AUDIOBOOK_POSITION_TOLERANCE_SEC = 120;

function sessionStartPosition(book: Awaited<ReturnType<typeof getBook>>) {
  return getProgressNumerator(book);
}

function evaluateAudiobookVelocity(
  positionLogged: number,
  activeSeconds: number,
): {
  velocityScore: number;
  flagged: boolean;
  flagReason: string | null;
  route: "instant" | "verification_queue";
} {
  if (positionLogged <= 0) {
    return { velocityScore: 1, flagged: false, flagReason: null, route: "instant" };
  }
  const maxAllowed = activeSeconds + AUDIOBOOK_POSITION_TOLERANCE_SEC;
  if (positionLogged > maxAllowed) {
    return {
      velocityScore: 0,
      flagged: true,
      flagReason: "Listening position advanced faster than session time",
      route: "verification_queue",
    };
  }
  return { velocityScore: 1, flagged: false, flagReason: null, route: "instant" };
}

function computeActiveSecondsIncrement(
  lastHeartbeat: Date,
  tabVisible: boolean,
  now: Date = new Date(),
): number {
  const gapSec = (now.getTime() - lastHeartbeat.getTime()) / 1000;
  if (gapSec > ANTI_CHEAT.MAX_HEARTBEAT_GAP_SEC) return 0;
  return tabVisible
    ? Math.floor(Math.min(gapSec, ANTI_CHEAT.MAX_HEARTBEAT_INCREMENT_SEC))
    : 0;
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
      startPage: sessionStartPosition(book),
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
  const increment = computeActiveSecondsIncrement(session.lastHeartbeat, tabVisible, now);

  const [updated] = await db
    .update(readingSessions)
    .set({
      activeSeconds: session.activeSeconds + increment,
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

  const now = new Date();
  const increment = computeActiveSecondsIncrement(session.lastHeartbeat, true, now);

  const [updated] = await db
    .update(readingSessions)
    .set({
      status: "paused",
      activeSeconds: session.activeSeconds + increment,
      lastHeartbeat: now,
      updatedAt: now,
    })
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

export type FinalizeSessionInput = {
  endPage?: number;
  endPositionSeconds?: number;
};

export async function finalizeReadingSession(
  userId: number,
  bookId: number,
  sessionId: number,
  clientToken: string,
  input: FinalizeSessionInput,
) {
  const session = await assertSessionToken(sessionId, userId, clientToken);
  if (session.bookId !== bookId) throw new ApiError(400, "Session does not match book");
  if (session.status !== "active" && session.status !== "paused") {
    throw new ApiError(400, "Session is already closed");
  }

  const book = await getBook(bookId, userId);
  const rules = await getGameRules();

  let endPosition: number;
  if (book.consumptionFormat === "audiobook") {
    if (input.endPositionSeconds === undefined) {
      throw new ApiError(400, "endPositionSeconds is required for audiobook sessions");
    }
    endPosition = input.endPositionSeconds;
  } else {
    if (input.endPage === undefined) {
      throw new ApiError(400, "endPage is required for print and e-reader sessions");
    }
    endPosition = input.endPage;
  }

  validateProgressValue(book, endPosition);
  if (endPosition < session.startPage) {
    throw new ApiError(400, "End position cannot be before session start");
  }

  const positionLogged = endPosition - session.startPage;
  const now = new Date();
  let activeSeconds = session.activeSeconds;
  if (session.status === "active") {
    activeSeconds += computeActiveSecondsIncrement(session.lastHeartbeat, true, now);
  }

  let velocityScore = 1;
  let flagged = false;
  let flagReason: string | null = null;
  let route: VelocityRoute = "instant";
  let pagesPerMin = 0;
  let wpmEstimate: number | null = null;
  let pagesLogged = positionLogged;

  if (book.consumptionFormat === "audiobook") {
    const audioVelocity = evaluateAudiobookVelocity(positionLogged, activeSeconds);
    velocityScore = audioVelocity.velocityScore;
    flagged = audioVelocity.flagged;
    flagReason = audioVelocity.flagReason;
    route = audioVelocity.route;
    pagesLogged = Math.max(1, Math.round(positionLogged / 60));
    pagesPerMin = activeSeconds > 0 ? (positionLogged / activeSeconds) * 60 : 0;
  } else {
    const velocityRules: VelocityRules = {
      minSecondsPerPage: rules.minSecondsPerPage,
      softSecondsPerPage: rules.softSecondsPerPage,
      maxWpm: rules.maxWpm,
      softWpm: rules.softWpm,
      defaultWordsPerPage: ANTI_CHEAT.DEFAULT_WORDS_PER_PAGE,
    };
    const velocity = evaluateReadingVelocity(
      {
        pagesLogged: positionLogged,
        activeSeconds,
        wordsPerPage: wordsPerPageForBook(book),
        source: session.source,
      },
      velocityRules,
    );
    velocityScore = velocity.velocityScore;
    flagged = velocity.flagged;
    flagReason = velocity.flagReason;
    route = velocity.route;
    pagesPerMin = velocity.pagesPerMin;
    wpmEstimate = velocity.wpmEstimate;
  }

  const oldPct = getProgressPercent(book);
  const fieldPatch =
    book.consumptionFormat === "audiobook"
      ? { currentPositionSeconds: endPosition }
      : { currentPage: endPosition };
  const newPct = getProgressPercent({ ...book, ...fieldPatch });
  const milestonesCrossed = rules.milestones.filter((m) => oldPct < m && newPct >= m);
  const fullPointsPerMilestone = rules.pointsPerMilestone;
  const pointsRequested = milestonesCrossed.length * fullPointsPerMilestone;

  const caps = await getOrResetCaps(userId);
  const { allowedPoints } = applyPointCaps(pointsRequested, caps);

  const velocityScoreInt = Math.round(velocityScore * 100);
  const pagesPerMinX100 = Math.round(pagesPerMin * 100);

  const [updatedSession] = await db
    .update(readingSessions)
    .set({
      status: "completed",
      endPage: endPosition,
      pagesLogged,
      activeSeconds,
      endTime: now,
      lastHeartbeat: now,
      pagesPerMinX100,
      wpmEstimate: wpmEstimate != null ? Math.round(wpmEstimate) : null,
      velocityScore: velocityScoreInt,
      flagReason,
      updatedAt: now,
    })
    .where(eq(readingSessions.id, sessionId))
    .returning();

  const bookPatch = statusPatchFromProgress(book, endPosition, fieldPatch);
  const [updatedBook] = await db
    .update(books)
    .set(bookPatch)
    .where(eq(books.id, bookId))
    .returning();

  const awardedMilestones: MilestoneType[] = [];
  let awardedPoints = 0;
  let campaignNodesUnlocked: string[] = [];

  const pointsPerMilestoneAward =
    milestonesCrossed.length > 0
      ? Math.min(
          fullPointsPerMilestone,
          Math.floor(allowedPoints / milestonesCrossed.length),
        )
      : 0;

  for (const milestone of milestonesCrossed) {
    const type = `milestone_${milestone}` as MilestoneType;

    const result = await db.execute(sql`
      insert into points_ledger (
        user_id, book_id, era_id, session_id, type, points, points_requested, status, metadata
      )
      values (
        ${userId}, ${bookId}, ${book.eraId}, ${sessionId}, ${type},
        ${pointsPerMilestoneAward},
        ${fullPointsPerMilestone},
        ${"settled"},
        ${JSON.stringify({ velocityScore, flagReason })}
      )
      on conflict (book_id, type) where type like 'milestone_%' do nothing
      returning id
    `);

    if (result.length > 0) {
      awardedMilestones.push(type);
    }
  }

  if (awardedMilestones.length > 0 && pointsPerMilestoneAward > 0) {
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
  }

  if (milestonesCrossed.length > 0) {
    campaignNodesUnlocked = (
      await unlockCampaignMilestones(userId, book.eraId, milestonesCrossed)
    ).newlyUnlocked;
  }

  const stats = await getUserStats(userId);

  return {
    session: updatedSession,
    book: updatedBook,
    awardedMilestones,
    awardedPoints,
    campaignNodesUnlocked,
    velocity: {
      pagesPerMin,
      wpmEstimate,
      velocityScore,
      flagged: false,
      flagReason: null,
      route,
    },
    stats,
  };
}
