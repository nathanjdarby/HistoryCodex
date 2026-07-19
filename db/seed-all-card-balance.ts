import { eq } from "drizzle-orm";
import { db } from "./index";
import { characters, eras } from "./schema";
import { resolveCardBalance } from "./data/card-balance";
import { applyCardBalance } from "../lib/server/apply-card-balance";

async function main() {
  const rows = await db
    .select({
      id: characters.id,
      seed: characters.seed,
      name: characters.name,
      cardType: characters.cardType,
      eraName: eras.name,
    })
    .from(characters)
    .innerJoin(eras, eq(characters.eraId, eras.id));

  let updated = 0;
  const missing: string[] = [];

  for (const row of rows) {
    const def = resolveCardBalance({
      seed: row.seed,
      name: row.name,
      eraName: row.eraName,
    });

    if (!def) {
      missing.push(`${row.name} (${row.seed})`);
      continue;
    }

    await applyCardBalance(row.id, row.cardType, def);
    updated++;
  }

  if (missing.length > 0) {
    console.warn(`Missing balance definitions (${missing.length}):`);
    for (const entry of missing) console.warn(`  - ${entry}`);
  }

  console.log(`Applied balance to ${updated} of ${rows.length} cards.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
