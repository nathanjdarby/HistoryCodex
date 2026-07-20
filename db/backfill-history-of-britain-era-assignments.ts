import { eq } from "drizzle-orm";
import { db } from "./index";
import { characters, eras } from "./schema";

/** History of Britain cards staged in .to-organise — assign to best-fit eras. */
const SEED_ERA_SLUG: Record<string, string> = {
  // Tudor court & Reformation
  "a-history-of-britain-at-the-edge-of-the-world-3000bc-ad1603-character-anne-boleyn": "tudor-england",
  "a-history-of-britain-at-the-edge-of-the-world-3000bc-ad1603-character-edward-vi": "tudor-england",
  "a-history-of-britain-at-the-edge-of-the-world-3000bc-ad1603-character-elizabeth-i": "tudor-england",
  "a-history-of-britain-at-the-edge-of-the-world-3000bc-ad1603-character-henry-viii": "tudor-england",
  "a-history-of-britain-at-the-edge-of-the-world-3000bc-ad1603-character-mary-i": "tudor-england",
  "a-history-of-britain-at-the-edge-of-the-world-3000bc-ad1603-character-thomas-cromwell": "tudor-england",

  // Plantagenet dynasty
  "a-history-of-britain-at-the-edge-of-the-world-3000bc-ad1603-character-edward-i": "the-plantagenets",
  "a-history-of-britain-at-the-edge-of-the-world-3000bc-ad1603-character-eleanor-of-aquitaine":
    "the-plantagenets",
  "a-history-of-britain-at-the-edge-of-the-world-3000bc-ad1603-character-henry-ii": "the-plantagenets",
  "a-history-of-britain-at-the-edge-of-the-world-3000bc-ad1603-character-richard-ii": "the-plantagenets",
  "a-history-of-britain-at-the-edge-of-the-world-3000bc-ad1603-character-thomas-becket": "the-plantagenets",
  "a-history-of-britain-at-the-edge-of-the-world-3000bc-ad1603-location-canterbury-cathedral":
    "the-plantagenets",
  "a-history-of-britain-at-the-edge-of-the-world-3000bc-ad1603-location-wales": "the-plantagenets",
  "a-history-of-britain-at-the-edge-of-the-world-3000bc-ad1603-unit-english-royal-army": "the-plantagenets",
  "a-history-of-britain-at-the-edge-of-the-world-3000bc-ad1603-unit-welsh-forces": "the-plantagenets",

  // Norman Conquest
  "a-history-of-britain-at-the-edge-of-the-world-3000bc-ad1603-character-william-the-conqueror":
    "the-norman-era",
  "a-history-of-britain-at-the-edge-of-the-world-3000bc-ad1603-location-hastings": "the-norman-era",
  "a-history-of-britain-at-the-edge-of-the-world-3000bc-ad1603-unit-norman-army": "the-norman-era",

  // Anglo-Saxon & Viking Age
  "a-history-of-britain-at-the-edge-of-the-world-3000bc-ad1603-unit-anglo-saxons": "anglo-saxon",
  "a-history-of-britain-at-the-edge-of-the-world-3000bc-ad1603-unit-vikings": "the-viking-age",
  "a-history-of-britain-at-the-edge-of-the-world-3000bc-ad1603-location-orkney": "the-viking-age",

  // Early / ancient Britain
  "a-history-of-britain-at-the-edge-of-the-world-3000bc-ad1603-location-skara-brae": "roman-britain",

  // Medieval Britain (cross-kingdom)
  "a-history-of-britain-at-the-edge-of-the-world-3000bc-ad1603-character-robert-the-bruce":
    "medieval-england",
  "a-history-of-britain-at-the-edge-of-the-world-3000bc-ad1603-character-mary-queen-of-scots":
    "stuart-england",
  "a-history-of-britain-at-the-edge-of-the-world-3000bc-ad1603-location-england": "medieval-england",
  "a-history-of-britain-at-the-edge-of-the-world-3000bc-ad1603-location-kilkenny": "medieval-england",
  "a-history-of-britain-at-the-edge-of-the-world-3000bc-ad1603-location-london": "medieval-england",
  "a-history-of-britain-at-the-edge-of-the-world-3000bc-ad1603-location-scotland": "medieval-england",
  "a-history-of-britain-at-the-edge-of-the-world-3000bc-ad1603-unit-scottish-army": "medieval-england",
};

async function main() {
  const [stagingEra] = await db.select().from(eras).where(eq(eras.slug, "to-organise"));
  if (!stagingEra) {
    console.log("No .to-organise era found — nothing to move.");
    return;
  }

  const eraRows = await db.select().from(eras);
  const eraIdBySlug = new Map(eraRows.map((era) => [era.slug, era.id]));

  const stagingCards = await db
    .select({ id: characters.id, seed: characters.seed, name: characters.name })
    .from(characters)
    .where(eq(characters.eraId, stagingEra.id));

  let moved = 0;
  const skipped: string[] = [];

  for (const card of stagingCards) {
    const targetSlug = SEED_ERA_SLUG[card.seed];
    if (!targetSlug) {
      skipped.push(`${card.name} (${card.seed})`);
      continue;
    }

    const targetEraId = eraIdBySlug.get(targetSlug);
    if (targetEraId == null) {
      skipped.push(`${card.name} — unknown era slug "${targetSlug}"`);
      continue;
    }

    await db.update(characters).set({ eraId: targetEraId }).where(eq(characters.id, card.id));
    moved++;
    console.log(`  ${card.name} → ${targetSlug}`);
  }

  const remaining = await db
    .select({ id: characters.id })
    .from(characters)
    .where(eq(characters.eraId, stagingEra.id));

  if (skipped.length > 0) {
    console.warn("\nSkipped (no mapping):");
    for (const entry of skipped) console.warn(`  - ${entry}`);
  }

  console.log(`\nMoved ${moved} card(s) out of .to-organise. ${remaining.length} remain.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
