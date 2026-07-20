import { eq } from "drizzle-orm";
import { db } from "./index";
import { characters, eras } from "./schema";

/** Tudor-era figures imported via Hollow Crown book — move to tudor-england. */
const SEED_ERA_SLUG: Record<string, string> = {
  "the-hollow-crown-the-wars-of-the-roses-and-the-rise-of-the-tudors-character-henry-vii":
    "tudor-england",
  "the-hollow-crown-the-wars-of-the-roses-and-the-rise-of-the-tudors-character-elizabeth-of-york":
    "tudor-england",
  "the-hollow-crown-the-wars-of-the-roses-and-the-rise-of-the-tudors-character-margaret-beaufort":
    "tudor-england",
  "the-hollow-crown-the-wars-of-the-roses-and-the-rise-of-the-tudors-unit-tudor-invasion-army":
    "tudor-england",
  "the-hollow-crown-the-wars-of-the-roses-and-the-rise-of-the-tudors-event-marriage-of-henry-vii-and-elizabeth-of-york":
    "tudor-england",
  "the-hollow-crown-the-wars-of-the-roses-and-the-rise-of-the-tudors-event-battle-of-bosworth-field":
    "tudor-england",
  "the-hollow-crown-the-wars-of-the-roses-and-the-rise-of-the-tudors-event-battle-of-stoke-field":
    "tudor-england",
  "the-hollow-crown-the-wars-of-the-roses-and-the-rise-of-the-tudors-location-bosworth-field":
    "tudor-england",
};

async function main() {
  const eraRows = await db.select().from(eras);
  const eraBySlug = new Map(eraRows.map((era) => [era.slug, era.id]));
  let moved = 0;

  for (const [seed, slug] of Object.entries(SEED_ERA_SLUG)) {
    const eraId = eraBySlug.get(slug);
    if (!eraId) {
      console.warn(`Era not found: ${slug}`);
      continue;
    }

    const result = await db
      .update(characters)
      .set({ eraId })
      .where(eq(characters.seed, seed))
      .returning({ id: characters.id, name: characters.name });

    if (result.length > 0) {
      moved += result.length;
      console.log(`Moved ${result[0]!.name} → ${slug}`);
    }
  }

  console.log(`Updated era on ${moved} cards.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
