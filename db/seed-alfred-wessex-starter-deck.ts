import { and, eq } from "drizzle-orm";
import { db } from "./index";
import { ANGLO_SAXON_EVENT_BALANCE } from "./data/card-balance/anglo-saxon-events";
import { catalogBooks, catalogDecks, characters, eras } from "./schema";
import { validateDeckComposition } from "@/lib/battle/validators";
import { DEFAULT_BATTLE_RULES } from "@/lib/battle/constants";
import { applyCardBalance } from "@/lib/server/apply-card-balance";
import { buildEventBalance } from "@/lib/server/card-balance";
import { ApiError } from "@/lib/api-utils";
import { addCatalogBookCard } from "@/lib/server/catalog-book-cards";
import { createCatalogDeck, updateCatalogDeck } from "@/lib/server/catalog-decks";
import { setCatalogDeckCards } from "@/lib/server/catalog-deck-cards";
import type { CardBalanceDef } from "@/lib/server/card-balance";

const ERA_SLUG = "anglo-saxon";
const BOOK_TITLE = "The Anglo-Saxons";
const DECK_NAME = "Alfred & Wessex";

type EventDef = {
  seed: string;
  name: string;
  balance: CardBalanceDef;
};

const NEW_EVENTS: EventDef[] = [
  { seed: "event-danegeld", name: "Danegeld", balance: ANGLO_SAXON_EVENT_BALANCE["event-danegeld"] },
  { seed: "event-fyrd-muster", name: "Fyrd Muster", balance: ANGLO_SAXON_EVENT_BALANCE["event-fyrd-muster"] },
  {
    seed: "event-burh-fortification",
    name: "Burh Fortification",
    balance: ANGLO_SAXON_EVENT_BALANCE["event-burh-fortification"],
  },
  {
    seed: "event-battle-of-edington",
    name: "Battle of Edington",
    balance: ANGLO_SAXON_EVENT_BALANCE["event-battle-of-edington"],
  },
  {
    seed: "event-treaty-of-wedmore",
    name: "Treaty of Wedmore",
    balance: ANGLO_SAXON_EVENT_BALANCE["event-treaty-of-wedmore"],
  },
  {
    seed: "event-lindisfarne-raid",
    name: "Lindisfarne Raid",
    balance: ANGLO_SAXON_EVENT_BALANCE["event-lindisfarne-raid"],
  },
];

/** Seed → quantity for the Alfred & Wessex starter deck. */
const DECK_COMPOSITION: Record<string, number> = {
  "custom-alfred-the-great-410428f8": 1,
  "the-anglo-saxons-character-guthrum": 1,
  "the-anglo-saxons-character-bede": 1,
  "custom-edward-the-elder-05404c88": 1,
  "custom-thelfl-d-66197d10": 1,
  "custom-west-saxons-f927c74f": 3,
  "the-anglo-saxons-unit-saxons": 3,
  "the-anglo-saxons-unit-angles": 2,
  "anglo-saxon-england-5": 2,
  "unit-fallen-martyr": 2,
  "anglo-saxon-england-2": 2,
  "custom-vikings-2feb30f6": 2,
  "the-anglo-saxons-unit-great-army": 2,
  "the-anglo-saxons-unit-jutes": 1,
  "event-mobilize-reserves": 1,
  "event-danegeld": 2,
  "event-fyrd-muster": 2,
  "event-burh-fortification": 1,
  "event-battle-of-edington": 1,
  "event-treaty-of-wedmore": 1,
  "event-lindisfarne-raid": 1,
  "custom-wessex-56f523e7": 2,
  "custom-winchester-8f520ae7": 2,
  "custom-mercia-8c66dfe8": 1,
  "custom-york-dfcde10a": 1,
  "the-anglo-saxons-location-lindisfarne": 1,
};

async function upsertEvent(eraId: number, def: EventDef) {
  const [existing] = await db.select().from(characters).where(eq(characters.seed, def.seed));
  if (existing) {
    await applyCardBalance(existing.id, "event", def.balance);
    return existing;
  }

  const built = buildEventBalance(def.balance.rarity, def.balance.eventAbility!);

  const [created] = await db
    .insert(characters)
    .values({
      eraId,
      name: def.name,
      seed: def.seed,
      cardType: "event",
      rarity: built.rarity,
      cost: built.cost,
      archetype: built.archetype,
      attack: built.attack,
      defense: built.defense,
      flavorText: def.balance.flavorText ?? "",
      abilityName: built.abilityName,
      abilityEffect: built.abilityEffect,
      abilityValue: built.abilityValue,
      abilityTrigger: built.abilityTrigger,
    })
    .returning();

  await applyCardBalance(created.id, "event", def.balance);
  return created;
}

async function linkEventToBook(bookId: number, characterId: number) {
  try {
    await addCatalogBookCard(bookId, characterId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) return;
    throw err;
  }
}

async function findDeckByName(name: string) {
  const [row] = await db.select().from(catalogDecks).where(eq(catalogDecks.name, name));
  return row ?? null;
}

async function main() {
  const [era] = await db.select().from(eras).where(eq(eras.slug, ERA_SLUG));
  if (!era) throw new Error(`Era not found: ${ERA_SLUG}`);

  const [book] = await db
    .select()
    .from(catalogBooks)
    .where(and(eq(catalogBooks.title, BOOK_TITLE), eq(catalogBooks.eraId, era.id)));
  if (!book) throw new Error(`Catalog book not found: ${BOOK_TITLE}`);

  console.log("Creating Anglo-Saxon event cards…");
  for (const def of NEW_EVENTS) {
    const card = await upsertEvent(era.id, def);
    await linkEventToBook(book.id, card.id);
    console.log(`  + ${card.name} (${card.seed})`);
  }

  const deckEntries: { characterId: number; quantity: number; cardType: string }[] = [];
  for (const [seed, quantity] of Object.entries(DECK_COMPOSITION)) {
    const [row] = await db.select().from(characters).where(eq(characters.seed, seed));
    if (!row) throw new Error(`Deck card not found for seed: ${seed}`);
    deckEntries.push({ characterId: row.id, quantity, cardType: row.cardType });
  }

  const validation = validateDeckComposition(deckEntries, DEFAULT_BATTLE_RULES);
  if (!validation.valid) {
    throw new Error(`Starter deck composition invalid:\n${validation.errors.join("\n")}`);
  }

  let deck = await findDeckByName(DECK_NAME);
  if (!deck) {
    deck = await createCatalogDeck({
      name: DECK_NAME,
      description:
        "Starter deck built around Alfred the Great and the kingdom of Wessex — burhs, fyrd musters, and the Danish wars that forged England.",
      eraId: era.id,
      deckKind: "starter",
      price: 0,
      sortOrder: 0,
      active: true,
    });
    console.log(`Created catalog deck "${DECK_NAME}" (#${deck.id}).`);
  } else {
    await updateCatalogDeck(deck.id, {
      description:
        "Starter deck built around Alfred the Great and the kingdom of Wessex — burhs, fyrd musters, and the Danish wars that forged England.",
      eraId: era.id,
      deckKind: "starter",
      active: true,
    });
    console.log(`Updated catalog deck "${DECK_NAME}" (#${deck.id}).`);
  }

  await setCatalogDeckCards(
    deck.id,
    deckEntries.map(({ characterId, quantity }) => ({ characterId, quantity })),
  );

  console.log(
    `\n"${DECK_NAME}" — ${validation.totalCards}/${DEFAULT_BATTLE_RULES.deckSize} cards (valid).`,
  );
  console.log("View in Admin → DEX or seed card balance with npm run db:seed-all-card-balance.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
