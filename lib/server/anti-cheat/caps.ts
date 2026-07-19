import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { antiCheatEvents, userPointCaps, verificationQueue } from "@/db/schema";
import { getGameRules } from "@/lib/server/game-rules";

export type CapSnapshot = {
  dailyEarned: number;
  dailyCap: number;
  weeklyEarned: number;
  weeklyCap: number;
  trustScore: number;
};

export type CapResult = {
  allowedPoints: number;
  overflowPoints: number;
  dailyRemaining: number;
  weeklyRemaining: number;
};

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfUtcWeek(date = new Date()) {
  const day = date.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - diff);
  return startOfUtcDay(monday);
}

export async function getOrResetCaps(userId: number): Promise<CapSnapshot> {
  const now = new Date();
  const dayStart = startOfUtcDay(now);
  const weekStart = startOfUtcWeek(now);
  const rules = await getGameRules();

  const [existing] = await db.select().from(userPointCaps).where(eq(userPointCaps.userId, userId));

  if (!existing) {
    await db.insert(userPointCaps).values({
      userId,
      dailyCap: rules.dailyPointCap,
      weeklyCap: rules.weeklyPointCap,
      dailyResetAt: dayStart,
      weeklyResetAt: weekStart,
    });
    return {
      dailyEarned: 0,
      dailyCap: rules.dailyPointCap,
      weeklyEarned: 0,
      weeklyCap: rules.weeklyPointCap,
      trustScore: 100,
    };
  }

  let { dailyEarned, weeklyEarned, dailyResetAt, weeklyResetAt } = existing;
  const patch: Partial<typeof userPointCaps.$inferInsert> = { updatedAt: now };

  if (dailyResetAt < dayStart) {
    dailyEarned = 0;
    patch.dailyEarned = 0;
    patch.dailyResetAt = dayStart;
  }
  if (weeklyResetAt < weekStart) {
    weeklyEarned = 0;
    patch.weeklyEarned = 0;
    patch.weeklyResetAt = weekStart;
  }

  if (existing.dailyCap !== rules.dailyPointCap) {
    patch.dailyCap = rules.dailyPointCap;
  }
  if (existing.weeklyCap !== rules.weeklyPointCap) {
    patch.weeklyCap = rules.weeklyPointCap;
  }

  if (Object.keys(patch).length > 1) {
    await db.update(userPointCaps).set(patch).where(eq(userPointCaps.userId, userId));
  }

  return {
    dailyEarned,
    dailyCap: rules.dailyPointCap,
    weeklyEarned,
    weeklyCap: rules.weeklyPointCap,
    trustScore: existing.trustScore,
  };
}

export function applyPointCaps(requested: number, caps: CapSnapshot): CapResult {
  const dailyRemaining = Math.max(0, caps.dailyCap - caps.dailyEarned);
  const weeklyRemaining = Math.max(0, caps.weeklyCap - caps.weeklyEarned);
  const allowedPoints = Math.min(requested, dailyRemaining, weeklyRemaining);
  const overflowPoints = requested - allowedPoints;
  return { allowedPoints, overflowPoints, dailyRemaining, weeklyRemaining };
}

export async function recordCapUsage(userId: number, points: number) {
  if (points <= 0) return;
  await db
    .update(userPointCaps)
    .set({
      dailyEarned: sql`${userPointCaps.dailyEarned} + ${points}`,
      weeklyEarned: sql`${userPointCaps.weeklyEarned} + ${points}`,
      updatedAt: new Date(),
    })
    .where(eq(userPointCaps.userId, userId));
}

export async function decayTrustScore(userId: number, amount?: number) {
  const rules = await getGameRules();
  const decay = amount ?? rules.trustDecayPerFlag;
  await db
    .update(userPointCaps)
    .set({
      trustScore: sql`max(0, ${userPointCaps.trustScore} - ${decay})`,
      updatedAt: new Date(),
    })
    .where(eq(userPointCaps.userId, userId));
}

export async function recordAntiCheatEvent(
  userId: number,
  eventType: string,
  sessionId: number | null,
  details: Record<string, unknown>,
  severity = 1,
) {
  await db.insert(antiCheatEvents).values({
    userId,
    eventType,
    sessionId,
    severity,
    details: JSON.stringify(details),
  });
}

export async function enqueueVerification(
  userId: number,
  sessionId: number | null,
  reason: string,
  payload: Record<string, unknown>,
  ledgerId?: number,
) {
  await db.insert(verificationQueue).values({
    userId,
    sessionId,
    ledgerId: ledgerId ?? null,
    reason,
    payload: JSON.stringify(payload),
    status: "pending",
  });
}
