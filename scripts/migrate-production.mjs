import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsFolder = path.join(root, "db/migrations");

function resolveMigrationUrl() {
  const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL_DIRECT or DATABASE_URL is required for migrations.");
  }
  return url;
}

const connectionString = resolveMigrationUrl();
console.log(`Running Postgres migrations from ${migrationsFolder}...`);

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

await migrate(db, { migrationsFolder });

console.log("Migrations complete.");
await client.end();
