import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { eras, userEraStats, userStats } from "@/db/schema";
import { getUserStats } from "@/lib/server/stats";

export async function getUserEraStats(userId: number, eraId: number) {
  const [row] = await db
    .select()
    .from(userEraStats)
    .where(and(eq(userEraStats.userId, userId), eq(userEraStats.eraId, eraId)));
  if (row) return row;

  const [created] = await db
    .insert(userEraStats)
    .values({ userId, eraId, pointsBalance: 0, totalPointsEarned: 0 })
    .returning();
  return created;
}

export async function listUserEraStats(userId: number) {
  return db
    .select({
      eraId: userEraStats.eraId,
      eraName: eras.name,
      eraSlug: eras.slug,
      colorPrimary: eras.colorPrimary,
      pointsBalance: userEraStats.pointsBalance,
      totalPointsEarned: userEraStats.totalPointsEarned,
    })
    .from(userEraStats)
    .innerJoin(eras, eq(userEraStats.eraId, eras.id))
    .where(eq(userEraStats.userId, userId))
    .orderBy(eras.startYear);
}

/** Credit points to global balance and optionally the book's era bucket. */
export async function creditPoints(userId: number, eraId: number | null, points: number) {
  if (points <= 0) return;

  const stats = await getUserStats(userId);
  await db
    .update(userStats)
    .set({
      pointsBalance: stats.pointsBalance + points,
      totalPointsEarned: stats.totalPointsEarned + points,
      updatedAt: new Date(),
    })
    .where(eq(userStats.userId, userId));

  if (eraId != null) {
    const eraRow = await getUserEraStats(userId, eraId);
    await db
      .update(userEraStats)
      .set({
        pointsBalance: eraRow.pointsBalance + points,
        totalPointsEarned: eraRow.totalPointsEarned + points,
        updatedAt: new Date(),
      })
      .where(and(eq(userEraStats.userId, userId), eq(userEraStats.eraId, eraId)));
  }
}

/** Deduct from the era bucket only (used when paying era-point price for an era pack). */
export async function spendEraPoints(userId: number, eraId: number, points: number) {
  if (points <= 0) throw new Error("spend amount must be positive");

  const eraRow = await getUserEraStats(userId, eraId);
  if (eraRow.pointsBalance < points) {
    throw new Error("Not enough era points");
  }

  await db
    .update(userEraStats)
    .set({
      pointsBalance: eraRow.pointsBalance - points,
      updatedAt: new Date(),
    })
    .where(and(eq(userEraStats.userId, userId), eq(userEraStats.eraId, eraId)));
}

/** Deduct from the global balance only (used for general packs or general-point era pack purchases). */
export async function spendGeneralPoints(userId: number, points: number) {
  if (points <= 0) throw new Error("spend amount must be positive");

  const stats = await getUserStats(userId);
  if (stats.pointsBalance < points) {
    throw new Error("Not enough points");
  }

  await db
    .update(userStats)
    .set({
      pointsBalance: stats.pointsBalance - points,
      updatedAt: new Date(),
    })
    .where(eq(userStats.userId, userId));
}

/** @deprecated Use spendEraPoints or spendGeneralPoints — pack purchases no longer double-deduct. */
export async function spendPoints(userId: number, eraId: number | null, points: number) {
  if (points <= 0) throw new Error("spend amount must be positive");

  if (eraId != null) {
    await spendEraPoints(userId, eraId, points);
    return;
  }

  await spendGeneralPoints(userId, points);
}

export async function getEraPointsBalance(userId: number, eraId: number) {
  const row = await getUserEraStats(userId, eraId);
  return row.pointsBalance;
}
