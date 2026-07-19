import { and, asc, desc, eq, gte, inArray, isNull, lte, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { books, timelineEntries } from "@/db/schema";
import { ApiError } from "@/lib/api-utils";
import { validateDateRange } from "@/lib/entry-dates";
import { getUserEraIds } from "@/lib/server/user-eras";
import { z } from "zod";

const nullableMonth = z.number().int().min(1).max(12).nullable();
const nullableDay = z.number().int().min(1).max(31).nullable();

const entryDateFieldsSchema = z.object({
  year: z.number().int(),
  month: nullableMonth.optional(),
  day: nullableDay.optional(),
  yearEnd: z.number().int().nullable().optional(),
  monthEnd: nullableMonth.optional(),
  dayEnd: nullableDay.optional(),
});

function validateEntryDateFields(
  data: z.infer<typeof entryDateFieldsSchema>,
  ctx: z.RefinementCtx,
) {
  const error = validateDateRange({
    year: data.year,
    month: data.month ?? null,
    day: data.day ?? null,
    yearEnd: data.yearEnd ?? null,
    monthEnd: data.monthEnd ?? null,
    dayEnd: data.dayEnd ?? null,
  });
  if (error) {
    ctx.addIssue({ code: "custom", message: error, path: ["year"] });
  }
}

export const entryInputSchema = z
  .object({
    kind: z.enum(["book", "event", "person", "note"]),
    title: z.string().min(1).max(200),
    summary: z.string().max(500).nullable().optional(),
    content: z.string().max(20000).nullable().optional(),
    eraId: z.number().int().nullable().optional(),
    bookId: z.number().int().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
  })
  .merge(entryDateFieldsSchema)
  .superRefine(validateEntryDateFields);

export const entryPatchSchema = z
  .object({
    kind: z.enum(["book", "event", "person", "note"]).optional(),
    title: z.string().min(1).max(200).optional(),
    summary: z.string().max(500).nullable().optional(),
    content: z.string().max(20000).nullable().optional(),
    eraId: z.number().int().nullable().optional(),
    bookId: z.number().int().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    year: z.number().int().optional(),
    month: nullableMonth.optional(),
    day: nullableDay.optional(),
    yearEnd: z.number().int().nullable().optional(),
    monthEnd: nullableMonth.optional(),
    dayEnd: nullableDay.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.year === undefined) return;
    validateEntryDateFields(
      {
        year: data.year,
        month: data.month,
        day: data.day,
        yearEnd: data.yearEnd,
        monthEnd: data.monthEnd,
        dayEnd: data.dayEnd,
      },
      ctx,
    );
  });

export type EntryInput = z.infer<typeof entryInputSchema>;
export type EntryPatch = z.infer<typeof entryPatchSchema>;

export const entryFilterSchema = z.object({
  kind: z.enum(["book", "event", "person", "note"]).optional(),
  eraId: z.coerce.number().int().optional(),
  yearMin: z.coerce.number().int().optional(),
  yearMax: z.coerce.number().int().optional(),
});

export type EntryFilter = z.infer<typeof entryFilterSchema>;

export async function listEntries(filter: EntryFilter = {}) {
  const conditions = [];
  if (filter.kind) conditions.push(eq(timelineEntries.kind, filter.kind));
  if (filter.eraId !== undefined) conditions.push(eq(timelineEntries.eraId, filter.eraId));
  if (filter.yearMin !== undefined) conditions.push(gte(timelineEntries.year, filter.yearMin));
  if (filter.yearMax !== undefined) conditions.push(lte(timelineEntries.year, filter.yearMax));

  return db
    .select()
    .from(timelineEntries)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(timelineEntries.year), asc(timelineEntries.month), asc(timelineEntries.day));
}

export async function listEntriesForUser(userId: number, filter: EntryFilter = {}) {
  const subscribedEraIds = await getUserEraIds(userId);
  if (subscribedEraIds.length === 0) return [];

  const userBooks = await db
    .select({ id: books.id })
    .from(books)
    .where(eq(books.userId, userId));
  const userBookIds = userBooks.map((book) => book.id);

  const conditions = [
    or(isNull(timelineEntries.eraId), inArray(timelineEntries.eraId, subscribedEraIds)),
    or(
      ne(timelineEntries.kind, "book"),
      isNull(timelineEntries.bookId),
      userBookIds.length > 0
        ? inArray(timelineEntries.bookId, userBookIds)
        : sql`1 = 0`,
    ),
  ];

  if (filter.kind) conditions.push(eq(timelineEntries.kind, filter.kind));
  if (filter.eraId !== undefined) conditions.push(eq(timelineEntries.eraId, filter.eraId));
  if (filter.yearMin !== undefined) conditions.push(gte(timelineEntries.year, filter.yearMin));
  if (filter.yearMax !== undefined) conditions.push(lte(timelineEntries.year, filter.yearMax));

  return db
    .select()
    .from(timelineEntries)
    .where(and(...conditions))
    .orderBy(asc(timelineEntries.year), asc(timelineEntries.month), asc(timelineEntries.day));
}

export async function createEntryForUser(userId: number, input: EntryInput) {
  if (input.eraId != null) {
    const subscribedEraIds = await getUserEraIds(userId);
    if (!subscribedEraIds.includes(input.eraId)) {
      throw new ApiError(400, "That timeline is not enabled on your profile");
    }
  }
  return createEntry(input);
}

export async function getEntry(id: number) {
  const [entry] = await db.select().from(timelineEntries).where(eq(timelineEntries.id, id));
  if (!entry) throw new ApiError(404, "Entry not found");
  return entry;
}

export async function createEntry(input: EntryInput) {
  const [created] = await db
    .insert(timelineEntries)
    .values({
      ...input,
      month: input.month ?? null,
      day: input.day ?? null,
      monthEnd: input.monthEnd ?? null,
      dayEnd: input.dayEnd ?? null,
    })
    .returning();
  return created;
}

export async function updateEntry(id: number, input: EntryPatch) {
  await getEntry(id);
  const [updated] = await db
    .update(timelineEntries)
    .set({
      ...input,
      ...(input.month !== undefined ? { month: input.month ?? null } : {}),
      ...(input.day !== undefined ? { day: input.day ?? null } : {}),
      ...(input.monthEnd !== undefined ? { monthEnd: input.monthEnd ?? null } : {}),
      ...(input.dayEnd !== undefined ? { dayEnd: input.dayEnd ?? null } : {}),
      updatedAt: new Date(),
    })
    .where(eq(timelineEntries.id, id))
    .returning();
  return updated;
}

export async function deleteEntry(id: number) {
  await getEntry(id);
  await db.delete(timelineEntries).where(eq(timelineEntries.id, id));
}

export async function listRecentEntries(limit = 8) {
  return db.select().from(timelineEntries).orderBy(desc(timelineEntries.createdAt)).limit(limit);
}
