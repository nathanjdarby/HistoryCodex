import { and, eq } from "drizzle-orm";
import { db } from "./index";
import { catalogBooks, characters, eras } from "./schema";
import { slugify } from "../lib/api-utils";
import { computeDefaultBattleStats, computeDefaultLocationBuff } from "../lib/battle";
import { setCatalogBookCards } from "../lib/server/catalog-book-cards";
import type { Archetype, Rarity } from "../lib/sprite/generateSprite";

const GEORGIAN_SLUG = "georgian-britain";
const WAGER_TITLE = "The Wager";

const costByRarity: Record<Rarity, number> = {
  common: 20,
  uncommon: 40,
  rare: 75,
  epic: 150,
  legendary: 300,
  mythic: 450,
};

type CharacterDef = {
  name: string;
  rarity: Rarity;
  archetype: Archetype | null;
  flavorText: string;
};

type LocationDef = {
  name: string;
  rarity?: Rarity;
  flavorText: string;
};

const WAGER_CHARACTER_NAMES = [
  "David Cheap",
  "John Bulkeley",
  "John Byron",
  "George Anson",
  "Henry Cozens",
  "John Cummins",
  "James Mitchell",
  "John Duck",
  "Robert Pemberton",
] as const;

const NEW_CHARACTERS: CharacterDef[] = [
  {
    name: "John Byron",
    rarity: "rare",
    archetype: "sailor",
    flavorText:
      "Scarcely more than a boy when the Wager went aground, he endured hunger, mutiny, and open ocean—and lived to father a line that would one day shake English verse.",
  },
  {
    name: "George Anson",
    rarity: "epic",
    archetype: "leader",
    flavorText:
      "He sailed to seize Spanish treasure and lost half his fleet to the Horn—yet returned with prize money, renown, and reforms that would reshape the navy he had commanded.",
  },
  {
    name: "Henry Cozens",
    rarity: "uncommon",
    archetype: "merchant",
    flavorText:
      "While officers quarrelled over rank, the cooper shaped timber and hide into a vessel that could float. Craft, not pedigree, kept the castaways alive.",
  },
  {
    name: "John Cummins",
    rarity: "rare",
    archetype: "scholar",
    flavorText:
      "With axe and compass he turned wreckage into a boat, then put pen to paper beside the gunner. Their joint account became the record England would judge.",
  },
  {
    name: "James Mitchell",
    rarity: "uncommon",
    archetype: "warrior",
    flavorText:
      "Marooned on a bleak Patagonian shore, he held the line between order and starvation—one more hand shaping the timbers that would carry survivors home.",
  },
  {
    name: "John Duck",
    rarity: "common",
    archetype: "warrior",
    flavorText:
      "A marine sworn to discipline in a company falling to mutiny, he bore witness when authority cracked—and survived the long reckoning that followed.",
  },
  {
    name: "Robert Pemberton",
    rarity: "uncommon",
    archetype: "sailor",
    flavorText:
      "He reached Spanish Chile broken but breathing, traded his story for shelter, and waited—knowing London would demand an account of everything the Wager had done.",
  },
];

const WAGER_LOCATIONS: LocationDef[] = [
  {
    name: "Portsmouth, England",
    flavorText:
      "From the naval yards of England the squadron weighed anchor—men, provisions, and orders to round the world and strike at Spanish plate.",
  },
  {
    name: "Cape Horn",
    flavorText:
      "Where the Atlantic meets the Pacific in fury, the Wager met a gale that no seamanship could tame—and the southern ocean claimed another victim.",
  },
  {
    name: "Wager Island, Patagonia, Chile",
    flavorText:
      "A desolate Patagonian shore where shattered timber became shelter, quarrel became mutiny, and two hundred souls learned how small England feels.",
  },
  {
    name: "The Strait of Magellan",
    flavorText:
      "Narrow waters, bitter winds, and charts that lied—many a ship gambled on the strait rather than face the Horn, and many lost.",
  },
  {
    name: "Rio de Janeiro, Brazil",
    flavorText:
      "Where Bulkeley's starving crew at last tasted port wine and civilisation—Brazil's harbour offered salvation to those who had sailed through hell.",
  },
  {
    name: "Chiloé Island, Chile",
    flavorText:
      "Off the coast of Spanish Chile, castaways fetched up on fog-bound shores—half the world from home, alive by accident and stubborn luck.",
  },
  {
    name: "Santiago, Chile",
    flavorText:
      "In the high capital of Chile the survivors became prisoners of hospitality and suspicion—Spanish captains and English officers trading questions, not trust.",
  },
  {
    name: "The Admiralty, London, England",
    flavorText:
      "In Whitehall's stone halls the survivors faced not enemies but their own navy—court-martials that would decide whether wreck and mutiny were crime or courage.",
  },
];

function wagerSeed(name: string, cardType: "character" | "location") {
  return `wager-${cardType}-${slugify(name)}`;
}

async function upsertCharacter(
  eraId: number,
  def: CharacterDef,
) {
  const seed = wagerSeed(def.name, "character");
  const [existing] = await db.select().from(characters).where(eq(characters.seed, seed));
  if (existing) return existing;

  const stats = computeDefaultBattleStats(def.rarity, def.archetype);
  const [created] = await db
    .insert(characters)
    .values({
      eraId,
      name: def.name,
      seed,
      cardType: "character",
      rarity: def.rarity,
      cost: costByRarity[def.rarity],
      archetype: def.archetype,
      attack: stats.attack,
      defense: stats.defense,
      abilityName: stats.abilityName,
      abilityEffect: stats.abilityEffect,
      abilityValue: stats.abilityValue,
      flavorText: def.flavorText,
    })
    .returning();

  return created;
}

async function upsertLocation(eraId: number, def: LocationDef) {
  const rarity = def.rarity ?? "rare";
  const seed = wagerSeed(def.name, "location");
  const [existing] = await db.select().from(characters).where(eq(characters.seed, seed));
  if (existing) return existing;

  const [created] = await db
    .insert(characters)
    .values({
      eraId,
      name: def.name,
      seed,
      cardType: "location",
      rarity,
      cost: costByRarity[rarity],
      archetype: null,
      attack: 0,
      defense: 0,
      flavorText: def.flavorText,
      ...computeDefaultLocationBuff(rarity),
    })
    .returning();

  return created;
}

async function findCharacterByName(eraId: number, name: string) {
  const [row] = await db
    .select()
    .from(characters)
    .where(and(eq(characters.eraId, eraId), eq(characters.name, name)));
  if (!row) throw new Error(`Character not found: ${name}`);
  return row;
}

async function main() {
  const [era] = await db.select().from(eras).where(eq(eras.slug, GEORGIAN_SLUG));
  if (!era) throw new Error(`Era not found: ${GEORGIAN_SLUG}`);

  const [book] = await db
    .select()
    .from(catalogBooks)
    .where(and(eq(catalogBooks.title, WAGER_TITLE), eq(catalogBooks.eraId, era.id)));
  if (!book) throw new Error(`Catalog book not found: ${WAGER_TITLE}`);

  for (const def of NEW_CHARACTERS) {
    const created = await upsertCharacter(era.id, def);
    console.log(`Character: ${created.name} (${created.seed})`);
  }

  for (const def of WAGER_LOCATIONS) {
    const created = await upsertLocation(era.id, def);
    console.log(`Location: ${created.name} (${created.seed})`);
  }

  const characterIds: number[] = [];
  for (const name of WAGER_CHARACTER_NAMES) {
    const row = await findCharacterByName(era.id, name);
    characterIds.push(row.id);
  }

  for (const def of WAGER_LOCATIONS) {
    const row = await findCharacterByName(era.id, def.name);
    characterIds.push(row.id);
  }

  await setCatalogBookCards(book.id, characterIds);
  console.log(`Linked ${characterIds.length} cards to "${WAGER_TITLE}" (catalog book #${book.id}).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
