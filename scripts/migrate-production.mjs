import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function resolveDatabasePath() {
  if (process.env.DATABASE_PATH) {
    return path.resolve(process.env.DATABASE_PATH);
  }
  return path.join(root, "data", "historycodex.db");
}

const dbPath = resolveDatabasePath();
const dataDir = path.dirname(dbPath);
fs.mkdirSync(dataDir, { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite);
const migrationsFolder = path.join(root, "db", "migrations");

console.log(`Running migrations on ${dbPath}...`);
migrate(db, { migrationsFolder });
console.log("Migrations complete.");
sqlite.close();
