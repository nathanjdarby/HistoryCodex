/**
 * One-time migration: copy all rows from local SQLite into Supabase Postgres,
 * preserving numeric IDs and resetting serial sequences afterward.
 *
 * Usage:
 *   DATABASE_PATH=./data/historycodex.db DATABASE_URL_DIRECT=postgresql://... npm run db:migrate-sqlite-to-supabase
 */
import Database from "better-sqlite3";
import postgres from "postgres";
import path from "node:path";
import fs from "node:fs";

const SQLITE_PATH = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(process.cwd(), "data", "historycodex.db");

const PG_URL = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
if (!PG_URL) {
  throw new Error("DATABASE_URL_DIRECT or DATABASE_URL is required.");
}

if (!fs.existsSync(SQLITE_PATH)) {
  throw new Error(`SQLite database not found at ${SQLITE_PATH}`);
}

type TableSpec = {
  name: string;
  columns: string[];
  booleans?: string[];
  timestamps?: string[];
  skipId?: boolean;
};

const TABLES: TableSpec[] = [
  { name: "eras", columns: ["id", "name", "slug", "start_year", "end_year", "color_primary", "color_secondary", "region", "description", "created_at"], timestamps: ["created_at"] },
  { name: "users", columns: ["id", "email", "password_hash", "role", "first_name", "last_name", "nickname", "display_name_as", "created_at"], timestamps: ["created_at"] },
  { name: "characters", columns: ["id", "era_id", "name", "flavor_text", "seed", "rarity", "card_type", "cost", "archetype", "image_url", "image_focus_x", "image_focus_y", "image_scale", "holographic", "attack", "defense", "ability_name", "ability_effect", "ability_value", "ability_trigger", "created_at"], booleans: ["holographic"], timestamps: ["created_at"] },
  { name: "catalog_books", columns: ["id", "title", "author", "isbn", "open_library_id", "cover_url", "summary", "total_pages", "word_count", "words_per_page", "era_id", "timeline_year", "active", "created_at", "updated_at"], booleans: ["active"], timestamps: ["created_at", "updated_at"] },
  { name: "catalog_book_cards", columns: ["id", "catalog_book_id", "character_id", "sort_order", "created_at"], timestamps: ["created_at"] },
  { name: "catalog_decks", columns: ["id", "name", "description", "image_url", "era_id", "deck_kind", "price", "sort_order", "active", "created_at", "updated_at"], booleans: ["active"], timestamps: ["created_at", "updated_at"] },
  { name: "catalog_deck_cards", columns: ["id", "catalog_deck_id", "character_id", "quantity"] },
  { name: "booster_packs", columns: ["id", "name", "description", "image_url", "cards_per_pack", "price", "era_id", "card_type", "weight_common", "weight_uncommon", "weight_rare", "weight_epic", "weight_legendary", "weight_mythic", "active", "created_at", "updated_at"], booleans: ["active"], timestamps: ["created_at", "updated_at"] },
  { name: "game_rules", columns: ["id", "milestones_json", "points_per_milestone", "daily_point_cap", "weekly_point_cap", "pack_general_multiplier", "min_seconds_per_page", "soft_seconds_per_page", "max_wpm", "soft_wpm", "bulk_page_jump_threshold", "min_trust_for_instant_award", "trust_decay_per_flag", "trust_gain_on_approve", "battle_rules_json", "updated_at"], timestamps: ["updated_at"] },
  { name: "era_campaigns", columns: ["id", "era_id", "slug", "title", "theme_json", "created_at"], timestamps: ["created_at"] },
  { name: "books", columns: ["id", "user_id", "catalog_book_id", "title", "author", "isbn", "open_library_id", "cover_url", "summary", "total_pages", "current_page", "word_count", "words_per_page", "campaign_slug", "era_id", "status", "started_at", "finished_at", "created_at", "updated_at"], timestamps: ["started_at", "finished_at", "created_at", "updated_at"] },
  { name: "timeline_entries", columns: ["id", "kind", "title", "summary", "content", "year", "month", "day", "year_end", "month_end", "day_end", "era_id", "book_id", "image_url", "created_at", "updated_at"], timestamps: ["created_at", "updated_at"] },
  { name: "entry_links", columns: ["id", "source_entry_id", "target_entry_id", "link_type", "note", "created_at"], timestamps: ["created_at"] },
  { name: "user_characters", columns: ["id", "user_id", "character_id", "unlocked_at", "quantity", "source_book_id"], timestamps: ["unlocked_at"] },
  { name: "user_eras", columns: ["id", "user_id", "era_id", "created_at"], timestamps: ["created_at"] },
  { name: "user_stats", columns: ["id", "user_id", "points_balance", "total_points_earned", "books_finished", "updated_at"], timestamps: ["updated_at"] },
  { name: "user_era_stats", columns: ["id", "user_id", "era_id", "points_balance", "total_points_earned", "updated_at"], timestamps: ["updated_at"] },
  { name: "user_point_caps", columns: ["user_id", "daily_earned", "daily_cap", "daily_reset_at", "weekly_earned", "weekly_cap", "weekly_reset_at", "trust_score", "updated_at"], timestamps: ["daily_reset_at", "weekly_reset_at", "updated_at"], skipId: true },
  { name: "points_ledger", columns: ["id", "user_id", "book_id", "era_id", "session_id", "type", "points", "points_requested", "status", "metadata", "character_id", "pack_config_id", "created_at"], timestamps: ["created_at"] },
  { name: "reading_sessions", columns: ["id", "user_id", "book_id", "status", "start_page", "end_page", "pages_logged", "start_time", "end_time", "active_seconds", "paused_seconds", "last_heartbeat", "client_token", "source", "pages_per_min_x100", "wpm_estimate", "velocity_score", "flag_reason", "created_at", "updated_at"], timestamps: ["start_time", "end_time", "last_heartbeat", "created_at", "updated_at"] },
  { name: "verification_queue", columns: ["id", "user_id", "session_id", "ledger_id", "reason", "payload", "status", "reviewed_by", "reviewed_at", "created_at"], timestamps: ["reviewed_at", "created_at"] },
  { name: "anti_cheat_events", columns: ["id", "user_id", "event_type", "severity", "session_id", "details", "created_at"], timestamps: ["created_at"] },
  { name: "user_decks", columns: ["id", "user_id", "name", "is_default", "created_at", "updated_at"], booleans: ["is_default"], timestamps: ["created_at", "updated_at"] },
  { name: "user_deck_cards", columns: ["id", "deck_id", "character_id", "quantity"] },
  { name: "user_campaign_progress", columns: ["user_id", "era_id", "nodes_unlocked", "current_node", "updated_at"], timestamps: ["updated_at"], skipId: true },
  { name: "matches", columns: ["id", "user_id", "deck_id", "status", "phase", "active_player", "turn_number", "state_json", "winner", "created_at", "updated_at"], timestamps: ["created_at", "updated_at"] },
];

const SERIAL_TABLES = TABLES.filter((table) => !table.skipId).map((table) => table.name);

function toTimestamp(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    return value > 1_000_000_000_000 ? new Date(value) : new Date(value * 1000);
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function transformRow(spec: TableSpec, row: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const column of spec.columns) {
    let value = row[column];
    if (spec.booleans?.includes(column)) {
      value = value === 1 || value === true;
    } else if (spec.timestamps?.includes(column)) {
      value = toTimestamp(value);
    }
    out[column] = value ?? null;
  }
  return out;
}

async function main() {
  const sqlite = new Database(SQLITE_PATH, { readonly: true });
  const sql = postgres(PG_URL, { max: 1 });

  console.log(`Importing from ${SQLITE_PATH} into Supabase Postgres...`);

  const tableNames = TABLES.map((spec) => spec.name).join(", ");
  await sql.unsafe(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`);

  try {
    for (const spec of TABLES) {
      const rows = sqlite.prepare(`SELECT * FROM ${spec.name}`).all() as Record<string, unknown>[];
      if (rows.length === 0) {
        console.log(`  ${spec.name}: 0 rows`);
        continue;
      }

      const transformed = rows.map((row) => transformRow(spec, row));
      const columns = spec.columns;
      const columnList = columns.map((c) => `"${c}"`).join(", ");

      for (const row of transformed) {
        const values = columns.map((column) => row[column]);
        const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
        await sql.unsafe(
          `INSERT INTO ${spec.name} (${columnList}) VALUES (${placeholders})`,
          values as never[],
        );
      }

      console.log(`  ${spec.name}: ${rows.length} rows`);
    }

    for (const tableName of SERIAL_TABLES) {
      await sql.unsafe(`
        SELECT setval(
          pg_get_serial_sequence('${tableName}', 'id'),
          COALESCE((SELECT MAX(id) FROM ${tableName}), 1),
          (SELECT MAX(id) IS NOT NULL FROM ${tableName})
        )
      `);
    }

    console.log("Import complete. Serial sequences reset.");
  } finally {
    await sql.end();
    sqlite.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
