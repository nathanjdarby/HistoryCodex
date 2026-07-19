import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { eras, userEras } from "@/db/schema";
import { ApiError } from "@/lib/api-utils";
import { listEras } from "@/lib/server/eras";

export const userTimelinesInputSchema = z.object({
  eraIds: z.array(z.number().int()).max(100),
});

export async function getUserEraIds(userId: number): Promise<number[]> {
  const rows = await db
    .select({ eraId: userEras.eraId })
    .from(userEras)
    .where(eq(userEras.userId, userId));
  return rows.map((row) => row.eraId);
}

export async function listErasForUser(userId: number) {
  const eraIds = await getUserEraIds(userId);
  if (eraIds.length === 0) return [];
  return db
    .select()
    .from(eras)
    .where(inArray(eras.id, eraIds))
    .orderBy(eras.startYear);
}

export async function getUserTimelinesProfile(userId: number) {
  const available = await listEras();
  const selectedEraIds = await getUserEraIds(userId);
  const selected = available.filter((era) => selectedEraIds.includes(era.id));
  return { available, selected, selectedEraIds };
}

export async function setUserTimelines(userId: number, eraIds: number[]) {
  const uniqueIds = [...new Set(eraIds)];
  if (uniqueIds.length > 0) {
    const existing = await db.select({ id: eras.id }).from(eras).where(inArray(eras.id, uniqueIds));
    if (existing.length !== uniqueIds.length) {
      throw new ApiError(400, "One or more selected timelines were not found");
    }
  }

  await db.delete(userEras).where(eq(userEras.userId, userId));
  if (uniqueIds.length > 0) {
    await db.insert(userEras).values(uniqueIds.map((eraId) => ({ userId, eraId })));
  }

  return getUserTimelinesProfile(userId);
}

export async function assertUserHasEra(userId: number, eraId: number | null | undefined) {
  if (eraId == null) return;
  const subscribed = await getUserEraIds(userId);
  if (!subscribed.includes(eraId)) {
    throw new ApiError(400, "That timeline is not enabled on your profile");
  }
}
