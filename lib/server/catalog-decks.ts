import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { catalogDecks, eras } from "@/db/schema";
import { ApiError } from "@/lib/api-utils";
import { validateDeckComposition } from "@/lib/battle/validators";
import { getBattleRules } from "@/lib/server/battle-rules";
import {
  countCatalogDeckCards,
  listCatalogDeckCards,
  type CatalogDeckCardEntry,
} from "@/lib/server/catalog-deck-cards";

export const catalogDeckInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().max(2000).nullable().optional(),
  imageUrl: z.string().max(500).nullable().optional(),
  eraId: z.number().int().positive().nullable().optional(),
  deckKind: z.enum(["starter", "themed"]).optional(),
  price: z.number().int().min(0).optional(),
  sortOrder: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

export type CatalogDeckInput = z.infer<typeof catalogDeckInputSchema>;

export type CatalogDeckRow = typeof catalogDecks.$inferSelect;

export type CatalogDeckSummary = CatalogDeckRow & {
  eraName: string | null;
  totalCards: number;
  valid: boolean;
  validationErrors: string[];
};

function catalogSelectFields() {
  return {
    id: catalogDecks.id,
    name: catalogDecks.name,
    description: catalogDecks.description,
    imageUrl: catalogDecks.imageUrl,
    eraId: catalogDecks.eraId,
    deckKind: catalogDecks.deckKind,
    price: catalogDecks.price,
    sortOrder: catalogDecks.sortOrder,
    active: catalogDecks.active,
    createdAt: catalogDecks.createdAt,
    updatedAt: catalogDecks.updatedAt,
    eraName: eras.name,
  };
}

export async function validateCatalogDeckCards(cards: CatalogDeckCardEntry[]) {
  const rules = await getBattleRules();
  const composition = cards.map((entry) => ({
    characterId: entry.characterId,
    quantity: entry.quantity,
    cardType: entry.cardType,
  }));
  const deckCheck = validateDeckComposition(composition, rules);
  return {
    totalCards: deckCheck.totalCards,
    valid: deckCheck.valid,
    validationErrors: deckCheck.errors,
  };
}

async function deckSummary(
  row: Omit<CatalogDeckSummary, "totalCards" | "valid" | "validationErrors">,
  cardCounts: Map<number, number>,
  cardRows: CatalogDeckCardEntry[],
): Promise<CatalogDeckSummary> {
  const cards = cardRows.length > 0 ? cardRows : [];
  const validation =
    cards.length > 0
      ? await validateCatalogDeckCards(cards)
      : { totalCards: cardCounts.get(row.id) ?? 0, valid: false, validationErrors: ["Deck has no cards yet."] };

  return {
    ...row,
    totalCards: validation.totalCards,
    valid: validation.valid,
    validationErrors: validation.validationErrors,
  };
}

export async function listCatalogDecks(options?: { activeOnly?: boolean; deckKind?: "starter" | "themed" }) {
  const filters = [];
  if (options?.activeOnly) filters.push(eq(catalogDecks.active, true));
  if (options?.deckKind) filters.push(eq(catalogDecks.deckKind, options.deckKind));

  const rows = await db
    .select(catalogSelectFields())
    .from(catalogDecks)
    .leftJoin(eras, eq(catalogDecks.eraId, eras.id))
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(catalogDecks.sortOrder, desc(catalogDecks.createdAt));

  const counts = await countCatalogDeckCards(rows.map((row) => row.id));
  return rows.map((row) => ({
    ...row,
    totalCards: counts.get(row.id) ?? 0,
    valid: false,
    validationErrors: [] as string[],
  }));
}

export async function getCatalogDeck(id: number): Promise<CatalogDeckSummary> {
  const [row] = await db
    .select(catalogSelectFields())
    .from(catalogDecks)
    .leftJoin(eras, eq(catalogDecks.eraId, eras.id))
    .where(eq(catalogDecks.id, id));
  if (!row) throw new ApiError(404, "Catalog deck not found");

  const counts = await countCatalogDeckCards([id]);
  const cardRows = await listCatalogDeckCards(id);
  return deckSummary(row, counts, cardRows);
}

async function assertEraExists(eraId: number) {
  const [era] = await db.select().from(eras).where(eq(eras.id, eraId));
  if (!era) throw new ApiError(400, "Era not found");
}

export async function createCatalogDeck(input: CatalogDeckInput) {
  if (input.eraId != null) await assertEraExists(input.eraId);

  const [created] = await db
    .insert(catalogDecks)
    .values({
      ...input,
      deckKind: input.deckKind ?? "themed",
      price: input.price ?? 0,
      sortOrder: input.sortOrder ?? 0,
      active: input.active ?? true,
      updatedAt: new Date(),
    })
    .returning();

  return getCatalogDeck(created.id);
}

export async function updateCatalogDeck(id: number, input: Partial<CatalogDeckInput>) {
  await getCatalogDeck(id);
  if (input.eraId != null) await assertEraExists(input.eraId);

  await db
    .update(catalogDecks)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(catalogDecks.id, id));

  return getCatalogDeck(id);
}

export async function deleteCatalogDeck(id: number) {
  await getCatalogDeck(id);
  await db.delete(catalogDecks).where(eq(catalogDecks.id, id));
}
