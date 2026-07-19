import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { userCharacters, userDecks } from "@/db/schema";
import { ApiError } from "@/lib/api-utils";
import { grantCardCopy } from "@/lib/server/characters";
import { listCatalogDeckCards } from "@/lib/server/catalog-deck-cards";
import { getCatalogDeck, listCatalogDecks, type CatalogDeckSummary } from "@/lib/server/catalog-decks";
import { createUserDeck, getUserDeck, updateUserDeck, type UserDeck } from "@/lib/server/decks";

async function loadOwnedQuantities(userId: number) {
  const rows = await db
    .select({ characterId: userCharacters.characterId, quantity: userCharacters.quantity })
    .from(userCharacters)
    .where(eq(userCharacters.userId, userId));
  return new Map(rows.map((row) => [row.characterId, row.quantity]));
}

async function grantMissingCopies(
  userId: number,
  cards: { characterId: number; quantity: number }[],
) {
  const owned = await loadOwnedQuantities(userId);
  let granted = 0;

  for (const card of cards) {
    const ownedQty = owned.get(card.characterId) ?? 0;
    const missing = Math.max(0, card.quantity - ownedQty);
    for (let i = 0; i < missing; i++) {
      await grantCardCopy(userId, card.characterId);
      granted++;
    }
  }

  return granted;
}

export async function listPlayStarterDecks(): Promise<CatalogDeckSummary[]> {
  const rows = await listCatalogDecks({ activeOnly: true, deckKind: "starter" });
  return Promise.all(rows.map((row) => getCatalogDeck(row.id)));
}

export async function adoptStarterDeck(userId: number, catalogDeckId: number): Promise<UserDeck> {
  const catalogDeck = await getCatalogDeck(catalogDeckId);

  if (!catalogDeck.active) {
    throw new ApiError(404, "Starter deck not found");
  }
  if (catalogDeck.deckKind !== "starter") {
    throw new ApiError(400, "Only starter decks can be adopted from the catalog");
  }
  if (!catalogDeck.valid) {
    throw new ApiError(400, catalogDeck.validationErrors[0] ?? "Starter deck is not valid");
  }

  const cards = await listCatalogDeckCards(catalogDeckId);
  const deckCards = cards.map((card) => ({
    characterId: card.characterId,
    quantity: card.quantity,
  }));

  await grantMissingCopies(userId, deckCards);

  const [existingDeck] = await db
    .select()
    .from(userDecks)
    .where(and(eq(userDecks.userId, userId), eq(userDecks.name, catalogDeck.name)));

  if (existingDeck) {
    return updateUserDeck(userId, existingDeck.id, {
      name: catalogDeck.name,
      isDefault: true,
      cards: deckCards,
    });
  }

  const created = await createUserDeck(userId, {
    name: catalogDeck.name,
    isDefault: true,
    cards: deckCards,
  });

  return getUserDeck(userId, created.id);
}
