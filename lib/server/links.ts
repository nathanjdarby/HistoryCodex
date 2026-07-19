import { eq } from "drizzle-orm";
import { db } from "@/db";
import { entryLinks, timelineEntries } from "@/db/schema";
import { ApiError } from "@/lib/api-utils";
import { getBook } from "@/lib/server/books";
import { z } from "zod";

export const linkInputSchema = z
  .object({
    targetEntryId: z.number().int().optional(),
    targetBookId: z.number().int().optional(),
    linkType: z.string().min(1).max(60).default("relates_to"),
    note: z.string().max(500).nullable().optional(),
  })
  .refine((data) => data.targetEntryId != null || data.targetBookId != null, {
    message: "Provide targetEntryId or targetBookId",
  });

export type LinkInput = z.infer<typeof linkInputSchema>;

export async function getCompanionEntryForBook(bookId: number) {
  const [entry] = await db
    .select()
    .from(timelineEntries)
    .where(eq(timelineEntries.bookId, bookId));
  return entry ?? null;
}

export async function resolveLinkTargetEntryId(
  input: Pick<LinkInput, "targetEntryId" | "targetBookId">,
): Promise<number> {
  if (input.targetEntryId != null) return input.targetEntryId;
  if (input.targetBookId != null) {
    const companion = await getCompanionEntryForBook(input.targetBookId);
    if (!companion) throw new ApiError(404, "Book has no timeline entry");
    return companion.id;
  }
  throw new ApiError(400, "Provide targetEntryId or targetBookId");
}

export async function getBookLinksForUser(bookId: number, userId: number) {
  await getBook(bookId, userId);
  const companion = await getCompanionEntryForBook(bookId);
  if (!companion) {
    return { timelineEntryId: null as number | null, outgoing: [], backlinks: [] };
  }
  const { outgoing, backlinks } = await getEntryWithLinks(companion.id);
  return { timelineEntryId: companion.id, outgoing, backlinks };
}

export async function createLink(sourceEntryId: number, input: LinkInput) {
  const targetEntryId = await resolveLinkTargetEntryId(input);
  if (sourceEntryId === targetEntryId) {
    throw new ApiError(400, "An entry cannot link to itself");
  }
  const [source] = await db
    .select()
    .from(timelineEntries)
    .where(eq(timelineEntries.id, sourceEntryId));
  if (!source) throw new ApiError(404, "Source entry not found");
  const [target] = await db
    .select()
    .from(timelineEntries)
    .where(eq(timelineEntries.id, targetEntryId));
  if (!target) throw new ApiError(404, "Target entry not found");

  const [created] = await db
    .insert(entryLinks)
    .values({
      sourceEntryId,
      targetEntryId,
      linkType: input.linkType,
      note: input.note ?? null,
    })
    .returning();
  return created;
}

export async function deleteLink(sourceEntryId: number, linkId: number) {
  const [link] = await db.select().from(entryLinks).where(eq(entryLinks.id, linkId));
  if (!link || link.sourceEntryId !== sourceEntryId) {
    throw new ApiError(404, "Link not found");
  }
  await db.delete(entryLinks).where(eq(entryLinks.id, linkId));
}

export async function getEntryWithLinks(entryId: number) {
  const [entry] = await db.select().from(timelineEntries).where(eq(timelineEntries.id, entryId));
  if (!entry) throw new ApiError(404, "Entry not found");

  const outgoing = await db
    .select({
      linkId: entryLinks.id,
      linkType: entryLinks.linkType,
      note: entryLinks.note,
      entry: timelineEntries,
    })
    .from(entryLinks)
    .innerJoin(timelineEntries, eq(entryLinks.targetEntryId, timelineEntries.id))
    .where(eq(entryLinks.sourceEntryId, entryId));

  const backlinks = await db
    .select({
      linkId: entryLinks.id,
      linkType: entryLinks.linkType,
      note: entryLinks.note,
      entry: timelineEntries,
    })
    .from(entryLinks)
    .innerJoin(timelineEntries, eq(entryLinks.sourceEntryId, timelineEntries.id))
    .where(eq(entryLinks.targetEntryId, entryId));

  return { entry, outgoing, backlinks };
}
