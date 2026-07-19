import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userStats } from "@/db/schema";

export async function getUserStats(userId: number) {
  const [existing] = await db.select().from(userStats).where(eq(userStats.userId, userId));
  if (existing) return existing;
  const [created] = await db
    .insert(userStats)
    .values({ userId, pointsBalance: 0, totalPointsEarned: 0, booksFinished: 0 })
    .returning();
  return created;
}
