import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readMigrationFiles } from "drizzle-orm/migrator";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsTable = "__drizzle_migrations";

function resolveDatabasePath() {
  if (process.env.DATABASE_PATH) {
    return path.resolve(process.env.DATABASE_PATH);
  }
  return path.join(root, "data", "historycodex.db");
}

function stripSqlComments(sql) {
  return sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .trim();
}

const dbPath = resolveDatabasePath();
const dataDir = path.dirname(dbPath);
fs.mkdirSync(dataDir, { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const migrationsFolder = path.join(root, "db/migrations");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS ${migrationsTable} (
    id SERIAL PRIMARY KEY,
    hash text NOT NULL,
    created_at numeric
  )
`);

const lastApplied = sqlite
  .prepare(`SELECT created_at FROM ${migrationsTable} ORDER BY created_at DESC LIMIT 1`)
  .get();

const lastMillis = Number(lastApplied?.created_at ?? 0);
const migrations = readMigrationFiles({ migrationsFolder });

console.log(`Running migrations on ${dbPath}...`);

const insert = sqlite.prepare(
  `INSERT INTO ${migrationsTable} (hash, created_at) VALUES (?, ?)`,
);

const applyMigration = sqlite.transaction((migration) => {
  for (const stmt of migration.sql) {
    const executable = stripSqlComments(stmt);
    if (!executable) {
      continue;
    }
    sqlite.exec(executable);
  }
  insert.run(migration.hash, migration.folderMillis);
});

for (const migration of migrations) {
  if (migration.folderMillis > lastMillis) {
    applyMigration(migration);
  }
}

console.log("Migrations complete.");
sqlite.close();
