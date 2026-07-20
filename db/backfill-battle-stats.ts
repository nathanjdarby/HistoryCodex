import { eq } from "drizzle-orm";
import { db } from "./index";
import { characters } from "./schema";
import { computeDefaultBattleStats } from "../lib/battle";

async function main() {
  const rows = await db.select().from(characters);
  let updated = 0;

  for (const character of rows) {
    // Guard: only touch rows still at the post-migration default (0/0), so a
    // rerun never clobbers stats someone has since hand-tuned via the edit form.
    if (character.attack !== 0 || character.defense !== 0) continue;

    const stats = computeDefaultBattleStats(character.rarity, character.archetype);
    await db
      .update(characters)
      .set({
        attack: stats.attack,
        defense: stats.defense,
      })
      .where(eq(characters.id, character.id));
    updated++;
  }

  console.log(`Backfilled battle stats for ${updated} character(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
