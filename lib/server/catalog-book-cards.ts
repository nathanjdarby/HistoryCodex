import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  CARD_TYPE_ENUM,
  catalogBookCards,
  catalogBooks,
  characters,
  eras,
  userCharacters,
} from "@/db/schema";
import { ApiError } from "@/lib/api-utils";
import { getCatalogBook } from "@/lib/server/catalog-books";
import { getCharacter } from "@/lib/server/characters";
import type { Character, Era } from "@/lib/types";

export type CatalogBookCardRow = {
  id: number;
  catalogBookId: number;
  characterId: number;
  sortOrder: number;
  name: string;
  seed: string;
  cardType: (typeof CARD_TYPE_ENUM)[number];
  rarity: (typeof characters.$inferSelect)["rarity"];
  cost: number;
  attack: number;
  defense: number;
  abilityName: string | null;
  abilityEffect: (typeof characters.$inferSelect)["abilityEffect"];
  abilityValue: number | null;
  abilityTrigger: (typeof characters.$inferSelect)["abilityTrigger"];
  flavorText: string | null;
  holographic: boolean;
  eraId: number;
  eraName: string;
  eraColorPrimary: string;
  eraColorSecondary: string;
  imageUrl: string | null;
  imageFocusX: number;
  imageFocusY: number;
  imageScale: number;
  archetype: (typeof characters.$inferSelect)["archetype"];
  layoutId: (typeof characters.$inferSelect)["layoutId"];
  house: (typeof characters.$inferSelect)["house"];
  speed: (typeof characters.$inferSelect)["speed"];
};

export async function listCatalogBookCards(catalogBookId: number): Promise<CatalogBookCardRow[]> {
  await getCatalogBook(catalogBookId);

  const rows = await db
    .select({
      id: catalogBookCards.id,
      catalogBookId: catalogBookCards.catalogBookId,
      characterId: catalogBookCards.characterId,
      sortOrder: catalogBookCards.sortOrder,
      name: characters.name,
      seed: characters.seed,
      cardType: characters.cardType,
      rarity: characters.rarity,
      cost: characters.cost,
      attack: characters.attack,
      defense: characters.defense,
      abilityName: characters.abilityName,
      abilityEffect: characters.abilityEffect,
      abilityValue: characters.abilityValue,
      abilityTrigger: characters.abilityTrigger,
      flavorText: characters.flavorText,
      holographic: characters.holographic,
      eraId: characters.eraId,
      eraName: eras.name,
      eraColorPrimary: eras.colorPrimary,
      eraColorSecondary: eras.colorSecondary,
      imageUrl: characters.imageUrl,
      imageFocusX: characters.imageFocusX,
      imageFocusY: characters.imageFocusY,
      imageScale: characters.imageScale,
      archetype: characters.archetype,
      layoutId: characters.layoutId,
      house: characters.house,
      speed: characters.speed,
    })
    .from(catalogBookCards)
    .innerJoin(characters, eq(catalogBookCards.characterId, characters.id))
    .innerJoin(eras, eq(characters.eraId, eras.id))
    .where(eq(catalogBookCards.catalogBookId, catalogBookId))
    .orderBy(asc(catalogBookCards.sortOrder), asc(characters.name));

  return rows;
}

export type BookCardForUser = Character & {
  era: Era;
  owned: boolean;
  quantity: number;
  sortOrder: number;
};

export async function listCatalogBookCardsForUser(
  catalogBookId: number,
  userId: number,
): Promise<BookCardForUser[]> {
  const rows = await db
    .select({
      character: characters,
      era: eras,
      sortOrder: catalogBookCards.sortOrder,
      unlockedAt: userCharacters.unlockedAt,
      quantity: userCharacters.quantity,
    })
    .from(catalogBookCards)
    .innerJoin(characters, eq(catalogBookCards.characterId, characters.id))
    .innerJoin(eras, eq(characters.eraId, eras.id))
    .leftJoin(
      userCharacters,
      and(eq(userCharacters.characterId, characters.id), eq(userCharacters.userId, userId)),
    )
    .where(eq(catalogBookCards.catalogBookId, catalogBookId))
    .orderBy(asc(catalogBookCards.sortOrder), asc(characters.name));

  return rows.map(({ character, era, sortOrder, unlockedAt, quantity }) => ({
    ...character,
    era,
    sortOrder,
    owned: unlockedAt != null,
    quantity: unlockedAt != null ? quantity ?? 1 : 0,
  }));
}

export const addCatalogBookCardSchema = z.object({
  characterId: z.number().int().positive(),
});

export async function addCatalogBookCard(catalogBookId: number, characterId: number) {
  const catalog = await getCatalogBook(catalogBookId);
  const character = await getCharacter(characterId);

  if (catalog.eraId != null && character.eraId !== catalog.eraId) {
    throw new ApiError(400, "Card must belong to the same era as the book");
  }

  const existing = await db
    .select({ id: catalogBookCards.id })
    .from(catalogBookCards)
    .where(
      and(
        eq(catalogBookCards.catalogBookId, catalogBookId),
        eq(catalogBookCards.characterId, characterId),
      ),
    );
  if (existing.length > 0) {
    throw new ApiError(409, "Card is already linked to this book");
  }

  const [maxOrder] = await db
    .select({ sortOrder: catalogBookCards.sortOrder })
    .from(catalogBookCards)
    .where(eq(catalogBookCards.catalogBookId, catalogBookId))
    .orderBy(desc(catalogBookCards.sortOrder))
    .limit(1);

  const nextOrder = (maxOrder?.sortOrder ?? -1) + 1;

  await db.insert(catalogBookCards).values({
    catalogBookId,
    characterId,
    sortOrder: nextOrder,
  });

  return listCatalogBookCards(catalogBookId);
}

export async function removeCatalogBookCard(catalogBookId: number, characterId: number) {
  await getCatalogBook(catalogBookId);

  const deleted = await db
    .delete(catalogBookCards)
    .where(
      and(
        eq(catalogBookCards.catalogBookId, catalogBookId),
        eq(catalogBookCards.characterId, characterId),
      ),
    )
    .returning({ id: catalogBookCards.id });

  if (deleted.length === 0) {
    throw new ApiError(404, "Card is not linked to this book");
  }
}

export const setCatalogBookCardsSchema = z.object({
  characterIds: z.array(z.number().int().positive()),
});

export async function setCatalogBookCards(catalogBookId: number, characterIds: number[]) {
  const catalog = await getCatalogBook(catalogBookId);

  if (characterIds.length > 0) {
    const cardRows = await db
      .select({ id: characters.id, eraId: characters.eraId })
      .from(characters)
      .where(inArray(characters.id, characterIds));

    if (cardRows.length !== characterIds.length) {
      throw new ApiError(400, "One or more cards not found");
    }

    if (catalog.eraId != null) {
      const mismatched = cardRows.some((row) => row.eraId !== catalog.eraId);
      if (mismatched) {
        throw new ApiError(400, "All cards must belong to the same era as the book");
      }
    }
  }

  await db.delete(catalogBookCards).where(eq(catalogBookCards.catalogBookId, catalogBookId));

  if (characterIds.length > 0) {
    await db.insert(catalogBookCards).values(
      characterIds.map((characterId, index) => ({
        catalogBookId,
        characterId,
        sortOrder: index,
      })),
    );
  }

  return listCatalogBookCards(catalogBookId);
}

export async function countCatalogBookCards(catalogBookIds: number[]) {
  if (catalogBookIds.length === 0) return new Map<number, number>();

  const rows = await db
    .select({
      catalogBookId: catalogBookCards.catalogBookId,
    })
    .from(catalogBookCards)
    .where(inArray(catalogBookCards.catalogBookId, catalogBookIds));

  const counts = new Map<number, number>();
  for (const id of catalogBookIds) counts.set(id, 0);
  for (const row of rows) {
    counts.set(row.catalogBookId, (counts.get(row.catalogBookId) ?? 0) + 1);
  }
  return counts;
}
