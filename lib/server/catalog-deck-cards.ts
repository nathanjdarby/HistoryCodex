import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { catalogDeckCards, catalogDecks, characters, eras } from "@/db/schema";
import { ApiError } from "@/lib/api-utils";

export type CatalogDeckCardEntry = {
  characterId: number;
  quantity: number;
  name: string;
  cardType: string;
  cost: number;
  rarity: string;
  eraId: number;
  eraName: string;
};

async function loadCatalogDeckRow(catalogDeckId: number) {
  const [deck] = await db.select().from(catalogDecks).where(eq(catalogDecks.id, catalogDeckId));
  if (!deck) throw new ApiError(404, "Catalog deck not found");
  return deck;
}

export async function listCatalogDeckCards(catalogDeckId: number): Promise<CatalogDeckCardEntry[]> {
  await loadCatalogDeckRow(catalogDeckId);

  const rows = await db
    .select({
      characterId: catalogDeckCards.characterId,
      quantity: catalogDeckCards.quantity,
      name: characters.name,
      cardType: characters.cardType,
      cost: characters.cost,
      rarity: characters.rarity,
      eraId: characters.eraId,
      eraName: eras.name,
    })
    .from(catalogDeckCards)
    .innerJoin(characters, eq(catalogDeckCards.characterId, characters.id))
    .innerJoin(eras, eq(characters.eraId, eras.id))
    .where(eq(catalogDeckCards.catalogDeckId, catalogDeckId))
    .orderBy(asc(characters.cardType), asc(characters.name));

  return rows;
}

export const catalogDeckCardInputSchema = z.object({
  characterId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(4),
});

export const setCatalogDeckCardsSchema = z.object({
  cards: z.array(catalogDeckCardInputSchema),
});

export async function setCatalogDeckCards(
  catalogDeckId: number,
  cards: z.infer<typeof setCatalogDeckCardsSchema>["cards"],
) {
  const deck = await loadCatalogDeckRow(catalogDeckId);

  if (cards.length > 0) {
    const ids = cards.map((c) => c.characterId);
    const characterRows = await db
      .select({ id: characters.id, eraId: characters.eraId, name: characters.name })
      .from(characters)
      .where(inArray(characters.id, ids));

    if (characterRows.length !== ids.length) {
      throw new ApiError(400, "One or more cards not found");
    }

    if (deck.eraId != null) {
      const mismatched = characterRows.find((row) => row.eraId !== deck.eraId);
      if (mismatched) {
        throw new ApiError(400, `${mismatched.name} is not from the deck's era`);
      }
    }
  }

  await db.delete(catalogDeckCards).where(eq(catalogDeckCards.catalogDeckId, catalogDeckId));

  if (cards.length > 0) {
    await db.insert(catalogDeckCards).values(
      cards.map((entry) => ({
        catalogDeckId,
        characterId: entry.characterId,
        quantity: entry.quantity,
      })),
    );
  }

  return listCatalogDeckCards(catalogDeckId);
}

export async function countCatalogDeckCards(catalogDeckIds: number[]) {
  if (catalogDeckIds.length === 0) return new Map<number, number>();

  const rows = await db
    .select({
      catalogDeckId: catalogDeckCards.catalogDeckId,
      quantity: catalogDeckCards.quantity,
    })
    .from(catalogDeckCards)
    .where(inArray(catalogDeckCards.catalogDeckId, catalogDeckIds));

  const counts = new Map<number, number>();
  for (const id of catalogDeckIds) counts.set(id, 0);
  for (const row of rows) {
    counts.set(row.catalogDeckId, (counts.get(row.catalogDeckId) ?? 0) + row.quantity);
  }
  return counts;
}
