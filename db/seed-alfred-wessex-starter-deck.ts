import { and, eq, inArray } from "drizzle-orm";
import { db } from "./index";
import { resolveCardBalance } from "./data/card-balance";
import { catalogBooks, catalogDecks, characters, eras } from "./schema";
import { validateDeckComposition } from "@/lib/battle/validators";
import { DEFAULT_BATTLE_RULES } from "@/lib/battle/constants";
import { applyCardBalance } from "@/lib/server/apply-card-balance";
import {
  buildBalancedBattleStats,
  buildEventBalance,
  buildLocationBalance,
  COST_BY_RARITY,
} from "@/lib/server/card-balance";
import { ApiError } from "@/lib/api-utils";
import { addCatalogBookCard } from "@/lib/server/catalog-book-cards";
import { createCatalogDeck, updateCatalogDeck } from "@/lib/server/catalog-decks";
import { setCatalogDeckCards } from "@/lib/server/catalog-deck-cards";
import type { CardType } from "@/lib/card-types";

const ERA_SLUGS = ["anglo-saxon-england", "anglo-saxon"] as const;
const BOOK_TITLE = "The Anglo-Saxons";
const DECK_NAME = "Alfred & Wessex";
const ERA_NAME = "Anglo-Saxon England";

type CardDef = {
  seed: string;
  name: string;
  cardType: CardType;
};

/** Cards created or refreshed by this seed (events + Alfred-era customs). */
const STARTER_CARDS: CardDef[] = [
  // Characters
  { seed: "custom-alfred-the-great-410428f8", name: "Alfred the Great", cardType: "character" },
  { seed: "custom-edward-the-elder-05404c88", name: "Edward the Elder", cardType: "character" },
  { seed: "custom-thelfl-d-66197d10", name: "Æthelflæd", cardType: "character" },
  { seed: "custom-asser-of-st-david-s-0e7f1547", name: "Asser of St David's", cardType: "character" },
  // Units
  { seed: "custom-west-saxons-f927c74f", name: "West Saxons", cardType: "unit" },
  { seed: "custom-wessex-fyrd-b1665a81", name: "Wessex Fyrd", cardType: "unit" },
  { seed: "custom-shieldwall-veterans-c80ba139", name: "Shieldwall Veterans", cardType: "unit" },
  { seed: "custom-royal-engineers-191da18f", name: "Royal Engineers", cardType: "unit" },
  { seed: "custom-mercian-spearmen-a16f273e", name: "Mercian Spearmen", cardType: "unit" },
  { seed: "custom-vikings-2feb30f6", name: "Vikings", cardType: "unit" },
  { seed: "the-anglo-saxons-unit-saxons", name: "Saxons", cardType: "unit" },
  { seed: "the-anglo-saxons-unit-great-army", name: "Great Army", cardType: "unit" },
  { seed: "unit-fallen-martyr", name: "Fallen Martyr", cardType: "unit" },
  // Locations
  { seed: "custom-wessex-56f523e7", name: "Wessex", cardType: "location" },
  { seed: "custom-winchester-8f520ae7", name: "Winchester", cardType: "location" },
  { seed: "custom-athelney-marshes-3f5a0242", name: "Athelney Marshes", cardType: "location" },
  { seed: "custom-mercia-8c66dfe8", name: "Mercia", cardType: "location" },
  // Events
  { seed: "event-danegeld", name: "Danegeld", cardType: "event" },
  { seed: "event-fyrd-muster", name: "Fyrd Muster", cardType: "event" },
  { seed: "event-burh-fortification", name: "Burh Fortification", cardType: "event" },
  { seed: "event-battle-of-edington", name: "Battle of Edington", cardType: "event" },
  { seed: "event-treaty-of-wedmore", name: "Treaty of Wedmore", cardType: "event" },
  { seed: "event-lindisfarne-raid", name: "Lindisfarne Raid", cardType: "event" },
  { seed: "event-mobilize-reserves", name: "Mobilize Reserves", cardType: "event" },
];

/**
 * 40-card starter — defensive Wessex core, Danish pressure, burh/fyrd synergy.
 *
 * Characters (5): Alfred, Edward, Æthelflæd, Guthrum, Asser
 * Units (19): West Saxons, Wessex Fyrd, Saxons, veterans, engineers, martyrs, Danes
 * Events (9): muster, tribute, burhs, Edington, Wedmore, Lindisfarne, reserves
 * Locations (7): Wessex, Winchester, Athelney, Mercia, Lindisfarne
 */
const DECK_COMPOSITION: Record<string, number> = {
  "custom-alfred-the-great-410428f8": 1,
  "custom-edward-the-elder-05404c88": 1,
  "custom-thelfl-d-66197d10": 1,
  "the-anglo-saxons-character-guthrum": 1,
  "custom-asser-of-st-david-s-0e7f1547": 1,
  "custom-west-saxons-f927c74f": 3,
  "custom-wessex-fyrd-b1665a81": 3,
  "the-anglo-saxons-unit-saxons": 2,
  "custom-shieldwall-veterans-c80ba139": 2,
  "custom-royal-engineers-191da18f": 2,
  "unit-fallen-martyr": 2,
  "custom-vikings-2feb30f6": 2,
  "the-anglo-saxons-unit-great-army": 2,
  "custom-mercian-spearmen-a16f273e": 1,
  "event-fyrd-muster": 2,
  "event-danegeld": 2,
  "event-burh-fortification": 1,
  "event-battle-of-edington": 1,
  "event-treaty-of-wedmore": 1,
  "event-lindisfarne-raid": 1,
  "event-mobilize-reserves": 1,
  "custom-wessex-56f523e7": 2,
  "custom-winchester-8f520ae7": 2,
  "custom-athelney-marshes-3f5a0242": 1,
  "custom-mercia-8c66dfe8": 1,
  "the-anglo-saxons-location-lindisfarne": 1,
};

async function findAngloSaxonEra() {
  for (const slug of ERA_SLUGS) {
    const [era] = await db.select().from(eras).where(eq(eras.slug, slug));
    if (era) return era;
  }
  throw new Error(`Anglo-Saxon era not found (tried: ${ERA_SLUGS.join(", ")})`);
}

async function upsertStarterCard(eraId: number, def: CardDef) {
  const balance = resolveCardBalance({
    seed: def.seed,
    name: def.name,
    eraName: ERA_NAME,
  });
  if (!balance) {
    throw new Error(`Missing balance definition for ${def.name} (${def.seed})`);
  }

  const [existing] = await db.select().from(characters).where(eq(characters.seed, def.seed));
  if (existing) {
    await applyCardBalance(existing.id, def.cardType, balance);
    return existing;
  }

  if (def.cardType === "event") {
    if (!balance.eventAbility) {
      throw new Error(`Event ${def.seed} is missing eventAbility`);
    }
    const built = buildEventBalance(balance.rarity, balance.eventAbility);
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
        flavorText: balance.flavorText ?? "",
        abilityName: built.abilityName,
        abilityEffect: built.abilityEffect,
        abilityValue: built.abilityValue,
        abilityTrigger: built.abilityTrigger,
      })
      .returning();
    await applyCardBalance(created.id, "event", balance);
    return created;
  }

  if (def.cardType === "location") {
    const locationStats = buildLocationBalance(
      balance.rarity,
      balance.locationBuffAdjust ?? 0,
      balance.locationAbility,
    );
    const [created] = await db
      .insert(characters)
      .values({
        eraId,
        name: def.name,
        seed: def.seed,
        cardType: "location",
        rarity: balance.rarity,
        cost: COST_BY_RARITY[balance.rarity],
        archetype: null,
        attack: 0,
        defense: 0,
        flavorText: balance.flavorText ?? "",
        abilityTrigger: null,
        ...locationStats,
      })
      .returning();
    await applyCardBalance(created.id, "location", balance);
    return created;
  }

  const stats = buildBalancedBattleStats(
    balance.rarity,
    balance.archetype ?? null,
    balance.statProfile ?? "balanced",
    {
      attackAdjust: balance.attackAdjust,
      defenseAdjust: balance.defenseAdjust,
    },
  );
  const ability = balance.customAbility ?? {
    abilityName: stats.abilityName,
    abilityEffect: stats.abilityEffect,
    abilityValue: stats.abilityValue,
    abilityTrigger: null,
  };

  const [created] = await db
    .insert(characters)
    .values({
      eraId,
      name: def.name,
      seed: def.seed,
      cardType: def.cardType,
      rarity: balance.rarity,
      cost: COST_BY_RARITY[balance.rarity],
      archetype: balance.archetype ?? null,
      attack: stats.attack,
      defense: stats.defense,
      flavorText: balance.flavorText ?? "",
      abilityName: ability.abilityName,
      abilityEffect: ability.abilityEffect,
      abilityValue: ability.abilityValue,
      abilityTrigger: ability.abilityTrigger ?? null,
    })
    .returning();
  await applyCardBalance(created.id, def.cardType, balance);
  return created;
}

async function linkCardToBook(bookId: number, characterId: number) {
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

async function refreshDeckCardBalance(seeds: string[]) {
  const rows = await db.select().from(characters).where(inArray(characters.seed, seeds));
  for (const row of rows) {
    const balance = resolveCardBalance({
      seed: row.seed,
      name: row.name,
      eraName: ERA_NAME,
    });
    if (balance) {
      await applyCardBalance(row.id, row.cardType, balance);
    }
  }
}

async function main() {
  const era = await findAngloSaxonEra();

  const [book] = await db
    .select()
    .from(catalogBooks)
    .where(and(eq(catalogBooks.title, BOOK_TITLE), eq(catalogBooks.eraId, era.id)));
  if (!book) throw new Error(`Catalog book not found: ${BOOK_TITLE} (era #${era.id})`);

  console.log("Upserting Alfred & Wessex starter cards…");
  for (const def of STARTER_CARDS) {
    const card = await upsertStarterCard(era.id, def);
    await linkCardToBook(book.id, card.id);
    console.log(`  + ${card.name} (${card.seed})`);
  }

  const deckOnlySeeds = Object.keys(DECK_COMPOSITION).filter(
    (seed) => !STARTER_CARDS.some((def) => def.seed === seed),
  );
  if (deckOnlySeeds.length > 0) {
    console.log("Refreshing balance on existing deck cards…");
    await refreshDeckCardBalance(deckOnlySeeds);
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

  const description =
    "Starter deck built around Alfred the Great and the kingdom of Wessex — burhs, fyrd musters, and the Danish wars that forged England.";

  let deck = await findDeckByName(DECK_NAME);
  if (!deck) {
    deck = await createCatalogDeck({
      name: DECK_NAME,
      description,
      eraId: era.id,
      deckKind: "starter",
      price: 0,
      sortOrder: 0,
      active: true,
    });
    console.log(`Created catalog deck "${DECK_NAME}" (#${deck.id}).`);
  } else {
    await updateCatalogDeck(deck.id, {
      description,
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

  const typeCounts = deckEntries.reduce(
    (acc, entry) => {
      acc[entry.cardType] = (acc[entry.cardType] ?? 0) + entry.quantity;
      return acc;
    },
    {} as Record<string, number>,
  );

  console.log(
    `\n"${DECK_NAME}" — ${validation.totalCards}/${DEFAULT_BATTLE_RULES.deckSize} cards (valid).`,
  );
  console.log(
    `  Characters ${typeCounts.character ?? 0}, Units ${typeCounts.unit ?? 0}, Events ${typeCounts.event ?? 0}, Locations ${typeCounts.location ?? 0}`,
  );
  console.log("View in Admin → DEX or Play → Decks. Run db:seed-all-card-balance to refresh stats.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
