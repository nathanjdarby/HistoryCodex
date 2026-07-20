import { eq, inArray, like } from "drizzle-orm";
import { db } from "./index";
import { catalogBookCards, catalogBooks, characters, eras } from "./schema";
import { resolveCardBalance } from "./data/card-balance";
import { applyCardBalance } from "../lib/server/apply-card-balance";
import type { EraInput } from "../lib/server/eras";

const FRANCE_BOOK_TITLE = "France - A History - from Gaul to de Gaulle";
const CARD_SEED_PREFIX = "history-of-norway-";

const NEW_ERAS: (EraInput & { slug: string })[] = [
  {
    slug: "bourbon-france",
    name: "Bourbon France",
    startYear: 1589,
    endYear: 1792,
    colorPrimary: "#1a3a6e",
    colorSecondary: "#c8a951",
    region: "France",
    description: "From Henry IV to Louis XVI — the ancien régime and Versailles.",
  },
  {
    slug: "french-revolution-and-napoleonic-wars",
    name: "French Revolution & Napoleonic Wars",
    startYear: 1789,
    endYear: 1815,
    colorPrimary: "#002395",
    colorSecondary: "#dc2626",
    region: "France",
    description: "Revolution, Terror, and the First Empire.",
  },
  {
    slug: "second-french-empire",
    name: "Second French Empire",
    startYear: 1852,
    endYear: 1870,
    colorPrimary: "#003087",
    colorSecondary: "#b8860b",
    region: "France",
    description: "Napoleon III and the boulevards before Sedan.",
  },
  {
    slug: "modern-france",
    name: "Modern France",
    startYear: 1870,
    endYear: 1969,
    colorPrimary: "#0055a4",
    colorSecondary: "#6b7280",
    region: "France",
    description: "Third Republic, world wars, Resistance, and de Gaulle.",
  },
];

const SEED_ERA_SLUG: Record<string, string> = {
  [`${CARD_SEED_PREFIX}character-julius-caesar`]: "roman-empire",
  [`${CARD_SEED_PREFIX}character-vercingetorix`]: "roman-conquest-of-gaul",
  [`${CARD_SEED_PREFIX}character-charlemagne`]: "carolingian",
  [`${CARD_SEED_PREFIX}character-louis-xi`]: "valois-and-the-late-middle-ages",
  [`${CARD_SEED_PREFIX}character-joan-of-arc`]: "valois-and-the-late-middle-ages",
  [`${CARD_SEED_PREFIX}character-charles-vii`]: "valois-and-the-late-middle-ages",
  [`${CARD_SEED_PREFIX}character-francis-i`]: "french-renaissance-and-later-valois-monarchy",
  [`${CARD_SEED_PREFIX}character-henry-iv`]: "bourbon-france",
  [`${CARD_SEED_PREFIX}character-louis-xiv`]: "bourbon-france",
  [`${CARD_SEED_PREFIX}character-louis-xvi`]: "bourbon-france",
  [`${CARD_SEED_PREFIX}character-marie-antoinette`]: "bourbon-france",
  [`${CARD_SEED_PREFIX}character-maximilien-robespierre`]: "french-revolution-and-napoleonic-wars",
  [`${CARD_SEED_PREFIX}character-napoleon-bonaparte`]: "french-revolution-and-napoleonic-wars",
  [`${CARD_SEED_PREFIX}character-napoleon-iii`]: "second-french-empire",
  [`${CARD_SEED_PREFIX}character-philippe-petain`]: "modern-france",
  [`${CARD_SEED_PREFIX}character-charles-de-gaulle`]: "modern-france",
  [`${CARD_SEED_PREFIX}character-emile-zola`]: "modern-france",

  [`${CARD_SEED_PREFIX}location-gaul`]: "celtic-gaul",
  [`${CARD_SEED_PREFIX}location-reims`]: "carolingian",
  [`${CARD_SEED_PREFIX}location-normandy`]: "the-norman-era",
  [`${CARD_SEED_PREFIX}location-orleans`]: "valois-and-the-late-middle-ages",
  [`${CARD_SEED_PREFIX}location-agincourt`]: "valois-and-the-late-middle-ages",
  [`${CARD_SEED_PREFIX}location-paris`]: "bourbon-france",
  [`${CARD_SEED_PREFIX}location-versailles`]: "bourbon-france",
  [`${CARD_SEED_PREFIX}location-bastille`]: "french-revolution-and-napoleonic-wars",
  [`${CARD_SEED_PREFIX}location-valmy`]: "french-revolution-and-napoleonic-wars",
  [`${CARD_SEED_PREFIX}location-waterloo`]: "french-revolution-and-napoleonic-wars",
  [`${CARD_SEED_PREFIX}location-verdun`]: "modern-france",
  [`${CARD_SEED_PREFIX}location-vichy`]: "modern-france",

  [`${CARD_SEED_PREFIX}unit-roman-legions`]: "roman-empire",
  [`${CARD_SEED_PREFIX}unit-gaulish-coalition-under-vercingetorix`]: "roman-conquest-of-gaul",
  [`${CARD_SEED_PREFIX}unit-frankish-army-of-charlemagne`]: "carolingian",
  [`${CARD_SEED_PREFIX}unit-french-royal-army`]: "bourbon-france",
  [`${CARD_SEED_PREFIX}unit-french-revolutionary-army`]: "french-revolution-and-napoleonic-wars",
  [`${CARD_SEED_PREFIX}unit-grande-armee`]: "french-revolution-and-napoleonic-wars",
  [`${CARD_SEED_PREFIX}unit-free-french-forces`]: "modern-france",
  [`${CARD_SEED_PREFIX}unit-french-resistance`]: "modern-france",
};

async function ensureEras() {
  const existing = await db.select().from(eras);
  const bySlug = new Map(existing.map((era) => [era.slug, era.id]));

  for (const era of NEW_ERAS) {
    if (bySlug.has(era.slug)) continue;
    const [created] = await db
      .insert(eras)
      .values({
        name: era.name,
        slug: era.slug,
        startYear: era.startYear,
        endYear: era.endYear,
        colorPrimary: era.colorPrimary,
        colorSecondary: era.colorSecondary,
        region: era.region ?? null,
        description: era.description ?? null,
      })
      .returning();
    bySlug.set(created.slug, created.id);
    console.log(`Created era: ${created.name} (${created.slug})`);
  }

  return bySlug;
}

async function main() {
  const [franceBook] = await db
    .select()
    .from(catalogBooks)
    .where(eq(catalogBooks.title, FRANCE_BOOK_TITLE));

  if (!franceBook) {
    throw new Error(`Catalog book not found: "${FRANCE_BOOK_TITLE}"`);
  }

  const cards = await db
    .select({
      id: characters.id,
      seed: characters.seed,
      name: characters.name,
      cardType: characters.cardType,
    })
    .from(characters)
    .where(like(characters.seed, `${CARD_SEED_PREFIX}%`));

  if (cards.length === 0) {
    console.log("No France book cards found to organize.");
    return;
  }

  const eraIdBySlug = await ensureEras();
  const refreshedEras = await db.select().from(eras);
  for (const era of refreshedEras) eraIdBySlug.set(era.slug, era.id);

  let moved = 0;
  let balanced = 0;
  const skipped: string[] = [];

  for (const card of cards) {
    const targetSlug = SEED_ERA_SLUG[card.seed];
    if (!targetSlug) {
      skipped.push(`${card.name} (${card.seed})`);
      continue;
    }

    const targetEraId = eraIdBySlug.get(targetSlug);
    if (targetEraId == null) {
      skipped.push(`${card.name} — missing era "${targetSlug}"`);
      continue;
    }

    await db.update(characters).set({ eraId: targetEraId }).where(eq(characters.id, card.id));
    moved++;

    const eraName = refreshedEras.find((era) => era.id === targetEraId)?.name ?? targetSlug;
    const def = resolveCardBalance({ seed: card.seed, name: card.name, eraName });
    if (def) {
      await applyCardBalance(card.id, card.cardType, def);
      balanced++;
    } else {
      skipped.push(`${card.name} — no balance definition`);
    }

    console.log(`  ${card.name} → ${targetSlug}`);
  }

  const cardIds = cards.map((card) => card.id);

  await db
    .delete(catalogBookCards)
    .where(inArray(catalogBookCards.characterId, cardIds));

  await db.insert(catalogBookCards).values(
    cardIds.map((characterId, index) => ({
      catalogBookId: franceBook.id,
      characterId,
      sortOrder: index,
    })),
  );

  console.log(`\nLinked ${cardIds.length} card(s) to "${FRANCE_BOOK_TITLE}" (catalog #${franceBook.id}).`);
  console.log(`Moved ${moved} card(s) to historical eras. Applied balance to ${balanced}.`);

  if (skipped.length > 0) {
    console.warn("\nIssues:");
    for (const entry of skipped) console.warn(`  - ${entry}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
