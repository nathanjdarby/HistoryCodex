import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { books, boosterPacks, characters, eras, timelineEntries } from "@/db/schema";
import { ApiError, slugify } from "@/lib/api-utils";
import { z } from "zod";

export const eraInputSchema = z.object({
  name: z.string().min(1).max(120),
  startYear: z.number().int(),
  endYear: z.number().int(),
  colorPrimary: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #a1b2c3"),
  colorSecondary: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #a1b2c3"),
  region: z.string().max(120).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
});

export type EraInput = z.infer<typeof eraInputSchema>;

export async function listEras() {
  return db.select().from(eras).orderBy(eras.startYear);
}

export async function getEra(id: number) {
  const [era] = await db.select().from(eras).where(eq(eras.id, id));
  if (!era) throw new ApiError(404, "Era not found");
  return era;
}

export async function createEra(input: EraInput) {
  if (input.endYear < input.startYear) {
    throw new ApiError(400, "endYear must be >= startYear");
  }
  const baseSlug = slugify(input.name);
  let slug = baseSlug;
  let suffix = 1;
  while ((await db.select().from(eras).where(eq(eras.slug, slug))).length > 0) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
  const [created] = await db
    .insert(eras)
    .values({ ...input, slug })
    .returning();
  return created;
}

export async function updateEra(id: number, input: Partial<EraInput>) {
  const existing = await getEra(id);

  const startYear = input.startYear ?? existing.startYear;
  const endYear = input.endYear ?? existing.endYear;
  if (endYear < startYear) {
    throw new ApiError(400, "endYear must be >= startYear");
  }

  const patch: Partial<typeof eras.$inferInsert> = { ...input };

  if (input.name !== undefined && input.name !== existing.name) {
    const baseSlug = slugify(input.name);
    let slug = baseSlug;
    let suffix = 1;
    while (true) {
      const [conflict] = await db.select().from(eras).where(eq(eras.slug, slug));
      if (!conflict || conflict.id === id) break;
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }
    patch.slug = slug;
  }

  const [updated] = await db
    .update(eras)
    .set(patch)
    .where(eq(eras.id, id))
    .returning();
  return updated;
}

export async function deleteEra(id: number) {
  await getEra(id);

  const [[characterCount], [bookCount], [entryCount], [packCount]] = await Promise.all([
    db.select({ value: count() }).from(characters).where(eq(characters.eraId, id)),
    db.select({ value: count() }).from(books).where(eq(books.eraId, id)),
    db.select({ value: count() }).from(timelineEntries).where(eq(timelineEntries.eraId, id)),
    db.select({ value: count() }).from(boosterPacks).where(eq(boosterPacks.eraId, id)),
  ]);

  const blockers: string[] = [];
  if (characterCount.value > 0) {
    blockers.push(`${characterCount.value} character${characterCount.value === 1 ? "" : "s"}`);
  }
  if (bookCount.value > 0) {
    blockers.push(`${bookCount.value} book${bookCount.value === 1 ? "" : "s"}`);
  }
  if (entryCount.value > 0) {
    blockers.push(`${entryCount.value} timeline entr${entryCount.value === 1 ? "y" : "ies"}`);
  }
  if (packCount.value > 0) {
    blockers.push(`${packCount.value} booster pack${packCount.value === 1 ? "" : "s"}`);
  }

  if (blockers.length > 0) {
    throw new ApiError(
      400,
      `Cannot delete this era — it is still linked to ${blockers.join(", ")}. Reassign or remove them first.`,
    );
  }

  await db.delete(eras).where(eq(eras.id, id));
}
