import { sql } from "drizzle-orm";
import { db } from "./index";
import { boosterPacks, eras } from "./schema";

/** Admin staging bucket — not a playable historical era. */
const SKIP_ERA_SLUGS = new Set(["to-organise"]);

async function main() {
  const existingEraPacks = await db
    .select({ eraId: boosterPacks.eraId })
    .from(boosterPacks)
    .where(sql`${boosterPacks.eraId} IS NOT NULL`);

  const coveredEraIds = new Set(
    existingEraPacks.map((row) => row.eraId).filter((id): id is number => id != null),
  );

  const eraRows = await db.select().from(eras).orderBy(eras.startYear);
  const missingEras = eraRows.filter(
    (era) => !coveredEraIds.has(era.id) && !SKIP_ERA_SLUGS.has(era.slug),
  );

  if (missingEras.length === 0) {
    console.log("All eras already have booster packs.");
    return;
  }

  const created = await db
    .insert(boosterPacks)
    .values(
      missingEras.map((era) => ({
        name: era.name.trim(),
        description: null,
        price: 150,
        eraId: era.id,
        cardsPerPack: 10,
        cardType: null,
        weightCommon: 55,
        weightUncommon: 27,
        weightRare: 12,
        weightEpic: 5,
        weightLegendary: 1,
        weightMythic: 1,
        active: true,
      })),
    )
    .returning({ id: boosterPacks.id, name: boosterPacks.name, eraId: boosterPacks.eraId });

  console.log(`Created ${created.length} era booster packs:`);
  for (const pack of created) {
    console.log(`  #${pack.id} ${pack.name} (era ${pack.eraId})`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
