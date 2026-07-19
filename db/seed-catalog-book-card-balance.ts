import { eq } from "drizzle-orm";
import { db } from "./index";
import { characters, eras } from "./schema";
import { resolveCardBalance } from "./data/card-balance";
import { applyCardBalance } from "../lib/server/apply-card-balance";

/** Alias for `db:seed-all-card-balance` — kept for backwards compatibility. */
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
  for (const row of rows) {
    const def = resolveCardBalance({
      seed: row.seed,
      name: row.name,
      eraName: row.eraName,
    });
    if (!def) continue;
    await applyCardBalance(row.id, row.cardType, def);
    updated++;
  }

  console.log(`Applied balance to ${updated} cards.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
