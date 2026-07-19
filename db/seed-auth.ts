import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "./index";
import { users } from "./schema";
import { getUserStats } from "@/lib/server/stats";

const DEFAULT_ACCOUNTS = [
  { email: "admin@example.com", password: "password", role: "admin" as const },
  { email: "user@example.com", password: "password", role: "user" as const },
];

async function main() {
  for (const account of DEFAULT_ACCOUNTS) {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, account.email));
    if (existing) {
      await getUserStats(existing.id);
      console.log(`Skipped existing account: ${account.email}`);
      continue;
    }

    await db.insert(users).values({
      email: account.email,
      passwordHash: await bcrypt.hash(account.password, 10),
      role: account.role,
    });
    const [created] = await db
      .select()
      .from(users)
      .where(eq(users.email, account.email));
    if (created) {
      await getUserStats(created.id);
    }
    console.log(`Created ${account.role} account: ${account.email} / ${account.password}`);
  }

  console.log("Auth seed complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
