import { eq } from "drizzle-orm";
import { db } from "./index";
import { characters, userDecks, users } from "./schema";
import { grantCardCopy } from "@/lib/server/characters";
import { createUserDeck } from "@/lib/server/decks";
import { DEFAULT_BATTLE_RULES } from "@/lib/battle/constants";
import {
  baselineDeckTargets,
  DECK_COMPOSITION_CARD_TYPES,
} from "@/lib/battle/deck-composition";

const TEST_EMAIL = "user@example.com";
const DECK_NAME = "Test Chronos Deck";
const DECK_SIZE = DEFAULT_BATTLE_RULES.deckSize;
const TARGETS = baselineDeckTargets();

async function main() {
  const [user] = await db.select().from(users).where(eq(users.email, TEST_EMAIL));
  if (!user) {
    throw new Error(`${TEST_EMAIL} not found — run npm run db:seed-auth first.`);
  }

  const cardsByType = {} as Record<
    (typeof DECK_COMPOSITION_CARD_TYPES)[number],
    { id: number; name: string; cardType: string; cost: number }[]
  >;

  for (const cardType of DECK_COMPOSITION_CARD_TYPES) {
    cardsByType[cardType] = await db
      .select({
        id: characters.id,
        name: characters.name,
        cardType: characters.cardType,
        cost: characters.cost,
      })
      .from(characters)
      .where(eq(characters.cardType, cardType))
      .orderBy(characters.cost, characters.id);
  }

  for (const cardType of DECK_COMPOSITION_CARD_TYPES) {
    if (cardsByType[cardType].length === 0) {
      throw new Error(`No ${cardType} cards in the database — run npm run db:seed first.`);
    }
  }

  const selectedByType = Object.fromEntries(
    DECK_COMPOSITION_CARD_TYPES.map((cardType) => {
      const needed = Math.ceil(TARGETS[cardType] / 3);
      return [cardType, cardsByType[cardType].slice(0, Math.max(needed, 1))];
    }),
  ) as typeof cardsByType;

  console.log(`Granting up to 3 copies each for test deck cards to ${TEST_EMAIL}…`);
  for (const cardType of DECK_COMPOSITION_CARD_TYPES) {
    for (const card of selectedByType[cardType]) {
      for (let i = 0; i < 3; i++) {
        await grantCardCopy(user.id, card.id);
      }
      console.log(`  + ${card.name} (${card.cardType}, ${card.cost} CP)`);
    }
  }

  const deckCards: { characterId: number; quantity: number }[] = [];
  for (const cardType of DECK_COMPOSITION_CARD_TYPES) {
    let remaining = TARGETS[cardType];
    for (const card of selectedByType[cardType]) {
      if (remaining <= 0) break;
      const qty = Math.min(3, remaining);
      deckCards.push({ characterId: card.id, quantity: qty });
      remaining -= qty;
    }
  }

  const existing = await db.select().from(userDecks).where(eq(userDecks.userId, user.id));
  for (const deck of existing) {
    if (deck.name === DECK_NAME) {
      await db.delete(userDecks).where(eq(userDecks.id, deck.id));
      console.log(`Removed previous "${DECK_NAME}" deck.`);
    }
  }

  const deck = await createUserDeck(user.id, {
    name: DECK_NAME,
    isDefault: true,
    cards: deckCards,
  });

  console.log(`\nCreated deck "${deck.name}" — ${deck.totalCards}/${DECK_SIZE} cards (valid: ${deck.valid}).`);
  console.log(`Log in as ${TEST_EMAIL} / password and go to /play to start a match.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
