import { eq } from "drizzle-orm";
import { db } from "./index";
import { characters } from "./schema";
import { defaultCardTypeForName, isHumanIdentifiableName } from "../lib/card-type";

async function main() {
  const rows = await db
    .select({ id: characters.id, name: characters.name, cardType: characters.cardType })
    .from(characters);

  let toCharacter = 0;
  let toUnit = 0;

  for (const row of rows) {
    if (row.cardType === "location") continue;

    const target = defaultCardTypeForName(row.name);
    if (row.cardType === target) continue;

    await db.update(characters).set({ cardType: target }).where(eq(characters.id, row.id));

    if (target === "character") {
      toCharacter++;
      console.log(`#${row.id} → character: ${row.name}`);
    } else {
      toUnit++;
      console.log(`#${row.id} → unit: ${row.name}`);
    }
  }

  const remainingCharacters = rows.filter(
    (row) => row.cardType !== "location" && isHumanIdentifiableName(row.name),
  );

  console.log(
    `\nDone. ${toUnit} reclassified as units, ${toCharacter} reclassified as characters.`,
  );
  console.log(`${remainingCharacters.length} human-identifiable names remain as characters.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
