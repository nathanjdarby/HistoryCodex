import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { characters, eras, userCharacters, userDeckCards, userDecks } from "@/db/schema";
import { ApiError } from "@/lib/api-utils";
import { expandDeckSnapshots, toCardSnapshot } from "@/lib/server/battle-cards";
import { buildAiDeckFromPool } from "@/lib/battle/ai-deck";
import { getBattleRules } from "@/lib/server/battle-rules";
import { splitExpandedDeck, validateDeckComposition } from "@/lib/battle/validators";
import {
  baselineDeckTargets,
  DECK_COMPOSITION_CARD_TYPES,
} from "@/lib/battle/deck-composition";

const deckCardSchema = z.object({
  characterId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1).max(4),
});

export const deckInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  isDefault: z.boolean().optional(),
  cards: z.array(deckCardSchema),
});

export type DeckInput = z.infer<typeof deckInputSchema>;

export type DeckCardEntry = {
  characterId: number;
  quantity: number;
  name: string;
  cardType: string;
  cost: number;
  rarity: string;
};

export type UserDeck = {
  id: number;
  name: string;
  isDefault: boolean;
  totalCards: number;
  valid: boolean;
  validationErrors: string[];
  cards: DeckCardEntry[];
  createdAt: Date;
  updatedAt: Date;
};

async function loadOwnedQuantities(userId: number) {
  const rows = await db
    .select({ characterId: userCharacters.characterId, quantity: userCharacters.quantity })
    .from(userCharacters)
    .where(eq(userCharacters.userId, userId));
  return new Map(rows.map((r) => [r.characterId, r.quantity]));
}

async function validateDeckCards(userId: number, cards: DeckInput["cards"]) {
  const rules = await getBattleRules();
  const owned = await loadOwnedQuantities(userId);
  const ids = cards.map((c) => c.characterId);
  const characterRows =
    ids.length > 0
      ? await db
          .select()
          .from(characters)
          .where(inArray(characters.id, ids))
      : [];

  const byId = new Map(characterRows.map((c) => [c.id, c]));
  const errors: string[] = [];

  if (cards.length === 0) {
    errors.push("Add at least one card to the deck.");
  }

  for (const entry of cards) {
    const row = byId.get(entry.characterId);
    if (!row) {
      errors.push(`Card #${entry.characterId} not found.`);
      continue;
    }
    const ownedQty = owned.get(entry.characterId) ?? 0;
    if (ownedQty < entry.quantity) {
      errors.push(`You only own ${ownedQty} copy/copies of ${row.name}.`);
    }
    if (entry.quantity > rules.maxCopiesPerCard) {
      errors.push(`${row.name} exceeds the max ${rules.maxCopiesPerCard} copies per card.`);
    }
  }

  const composition = cards.map((entry) => ({
    characterId: entry.characterId,
    quantity: entry.quantity,
    cardType: byId.get(entry.characterId)?.cardType ?? "character",
  }));

  const deckCheck = validateDeckComposition(composition, rules);
  const hardErrors = errors.filter(Boolean);
  const allErrors = [...hardErrors, ...deckCheck.errors];
  const hasHardErrors = hardErrors.length > 0;

  return {
    errors: allErrors,
    totalCards: deckCheck.totalCards,
    valid: !hasHardErrors && deckCheck.valid,
    byId,
  };
}

async function deckToResponse(deckId: number, userId: number): Promise<UserDeck> {
  const [deck] = await db
    .select()
    .from(userDecks)
    .where(and(eq(userDecks.id, deckId), eq(userDecks.userId, userId)));
  if (!deck) throw new ApiError(404, "Deck not found");

  const cardRows = await db
    .select({
      characterId: userDeckCards.characterId,
      quantity: userDeckCards.quantity,
      name: characters.name,
      cardType: characters.cardType,
      cost: characters.cost,
      rarity: characters.rarity,
    })
    .from(userDeckCards)
    .innerJoin(characters, eq(characters.id, userDeckCards.characterId))
    .where(eq(userDeckCards.deckId, deckId));

  const validation = await validateDeckCards(
    userId,
    cardRows.map((r) => ({ characterId: r.characterId, quantity: r.quantity })),
  );

  return {
    id: deck.id,
    name: deck.name,
    isDefault: deck.isDefault,
    totalCards: validation.totalCards,
    valid: validation.valid,
    validationErrors: validation.errors,
    cards: cardRows,
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt,
  };
}

export async function listUserDecks(userId: number) {
  const decks = await db
    .select()
    .from(userDecks)
    .where(eq(userDecks.userId, userId))
    .orderBy(desc(userDecks.isDefault), desc(userDecks.updatedAt));

  return Promise.all(decks.map((d) => deckToResponse(d.id, userId)));
}

export async function getUserDeck(userId: number, deckId: number) {
  return deckToResponse(deckId, userId);
}

export async function createUserDeck(userId: number, input: DeckInput) {
  const validation = await validateDeckCards(userId, input.cards);
  const hardErrors = validation.errors.filter(
    (message) =>
      message.includes("not found") ||
      message.includes("only own") ||
      message.includes("exceeds the max") ||
      message.includes("location cards") ||
      message.includes("Main deck must contain") ||
      message === "Add at least one card to the deck.",
  );
  if (hardErrors.length > 0) {
    throw new ApiError(400, hardErrors[0] ?? "Invalid deck");
  }

  const now = new Date();
  if (input.isDefault) {
    await db.update(userDecks).set({ isDefault: false }).where(eq(userDecks.userId, userId));
  }

  const [deck] = await db
    .insert(userDecks)
    .values({
      userId,
      name: input.name,
      isDefault: input.isDefault ?? false,
      updatedAt: now,
    })
    .returning();

  await db.insert(userDeckCards).values(
    input.cards.map((c) => ({
      deckId: deck!.id,
      characterId: c.characterId,
      quantity: c.quantity,
    })),
  );

  return deckToResponse(deck!.id, userId);
}

export async function updateUserDeck(userId: number, deckId: number, input: Partial<DeckInput>) {
  const [existing] = await db
    .select()
    .from(userDecks)
    .where(and(eq(userDecks.id, deckId), eq(userDecks.userId, userId)));
  if (!existing) throw new ApiError(404, "Deck not found");

  if (input.cards) {
    const validation = await validateDeckCards(userId, input.cards);
    const hardErrors = validation.errors.filter(
      (message) =>
        message.includes("not found") ||
        message.includes("only own") ||
        message.includes("exceeds the max") ||
        message.includes("only character, unit, and event") ||
        message === "Add at least one card to the deck.",
    );
    if (hardErrors.length > 0) {
      throw new ApiError(400, hardErrors[0] ?? "Invalid deck");
    }
    await db.delete(userDeckCards).where(eq(userDeckCards.deckId, deckId));
    await db.insert(userDeckCards).values(
      input.cards.map((c) => ({
        deckId,
        characterId: c.characterId,
        quantity: c.quantity,
      })),
    );
  }

  if (input.isDefault) {
    await db.update(userDecks).set({ isDefault: false }).where(eq(userDecks.userId, userId));
  }

  await db
    .update(userDecks)
    .set({
      ...(input.name ? { name: input.name } : {}),
      ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
      updatedAt: new Date(),
    })
    .where(eq(userDecks.id, deckId));

  return deckToResponse(deckId, userId);
}

export async function deleteUserDeck(userId: number, deckId: number) {
  const [existing] = await db
    .select()
    .from(userDecks)
    .where(and(eq(userDecks.id, deckId), eq(userDecks.userId, userId)));
  if (!existing) throw new ApiError(404, "Deck not found");
  await db.delete(userDecks).where(eq(userDecks.id, deckId));
}

export async function buildDeckSnapshots(userId: number, deckId: number) {
  const deck = await getUserDeck(userId, deckId);
  if (!deck.valid) throw new ApiError(400, deck.validationErrors[0] ?? "Deck is not valid");

  const cardRows = await db
    .select({ character: characters, era: eras })
    .from(userDeckCards)
    .innerJoin(characters, eq(characters.id, userDeckCards.characterId))
    .innerJoin(eras, eq(eras.id, characters.eraId))
    .where(eq(userDeckCards.deckId, deckId));

  const snapshots = cardRows.map(({ character, era }) => toCardSnapshot(character, era));
  const quantities = new Map(deck.cards.map((c) => [c.characterId, c.quantity]));
  return expandDeckSnapshots(snapshots, quantities);
}

export async function buildMatchDecks(userId: number, deckId: number) {
  return buildDeckSnapshots(userId, deckId);
}

export async function loadLocationDeck() {
  const rows = await db
    .select({ character: characters, era: eras })
    .from(characters)
    .innerJoin(eras, eq(eras.id, characters.eraId))
    .where(eq(characters.cardType, "location"));

  if (rows.length === 0) throw new ApiError(500, "No location cards configured.");
  return rows.map(({ character, era }) => toCardSnapshot(character, era));
}

export async function buildAiDeckFromCollection(userId: number) {
  const rules = await getBattleRules();
  const owned = await db
    .select({ character: characters, era: eras, quantity: userCharacters.quantity })
    .from(userCharacters)
    .innerJoin(characters, eq(characters.id, userCharacters.characterId))
    .innerJoin(eras, eq(eras.id, characters.eraId))
    .where(eq(userCharacters.userId, userId));

  const pool: ReturnType<typeof toCardSnapshot>[] = [];
  for (const row of owned.filter((r) => r.quantity > 0)) {
    const snap = toCardSnapshot(row.character, row.era);
    for (let i = 0; i < Math.min(row.quantity, rules.maxCopiesPerCard); i++) {
      pool.push(snap);
    }
  }

  if (pool.length === 0) throw new ApiError(400, "Collect cards before battling.");

  let result = buildAiDeckFromPool(pool, rules);
  if (!result.ok) {
    const fallbackLocations = await loadLocationDeck();
    if (fallbackLocations.length > 0 && !pool.some((c) => c.cardType === "location")) {
      pool.push(...fallbackLocations.slice(0, 3));
      result = buildAiDeckFromPool(pool, rules);
    }
  }

  if (!result.ok) {
    throw new ApiError(400, result.error);
  }

  return result.deck;
}
