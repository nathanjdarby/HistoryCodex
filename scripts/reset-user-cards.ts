import { eq, inArray } from "drizzle-orm";
import { db } from "../db/index";
import { userCharacters, userDeckCards, userDecks, users } from "../db/schema";

const EMAIL = process.argv[2];
if (!EMAIL) {
  console.error("Usage: tsx scripts/reset-user-cards.ts <email>");
  process.exit(1);
}

async function main() {
  const [user] = await db.select().from(users).where(eq(users.email, EMAIL));
  if (!user) {
    console.error(`No user found for ${EMAIL}`);
    process.exit(1);
  }

  const deckRows = await db
    .select({ id: userDecks.id })
    .from(userDecks)
    .where(eq(userDecks.userId, user.id));

  let deckCardsDeleted = 0;
  if (deckRows.length > 0) {
    const deckIds = deckRows.map((row) => row.id);
    const deletedDeckCards = await db
      .delete(userDeckCards)
      .where(inArray(userDeckCards.deckId, deckIds))
      .returning({ id: userDeckCards.id });
    deckCardsDeleted = deletedDeckCards.length;
  }

  const deletedCards = await db
    .delete(userCharacters)
    .where(eq(userCharacters.userId, user.id))
    .returning({ id: userCharacters.id });

  console.log(
    `Reset cards for ${EMAIL} (user #${user.id}): removed ${deletedCards.length} collection row(s), cleared ${deckCardsDeleted} deck card row(s).`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
