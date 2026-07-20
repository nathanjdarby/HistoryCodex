import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  serial,
  boolean,
  doublePrecision,
  timestamp,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";

export const eras = pgTable("eras", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  startYear: integer("start_year").notNull(),
  endYear: integer("end_year").notNull(),
  colorPrimary: text("color_primary").notNull(),
  colorSecondary: text("color_secondary").notNull(),
  region: text("region"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const catalogBooks = pgTable(
  "catalog_books",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    author: text("author"),
    isbn: text("isbn"),
    openLibraryId: text("open_library_id"),
    coverUrl: text("cover_url"),
    summary: text("summary"),
    totalPages: integer("total_pages").notNull(),
    wordCount: integer("word_count"),
    wordsPerPage: integer("words_per_page"),
    eraId: integer("era_id").references(() => eras.id),
    /** Year shown on the user timeline when this book is added to a library. */
    timelineYear: integer("timeline_year"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_catalog_books_era").on(table.eraId),
    index("idx_catalog_books_active").on(table.active),
  ],
);

export const books = pgTable(
  "books",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    catalogBookId: integer("catalog_book_id")
      .notNull()
      .references(() => catalogBooks.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    author: text("author"),
    isbn: text("isbn"),
    openLibraryId: text("open_library_id"),
    coverUrl: text("cover_url"),
    summary: text("summary"),
    totalPages: integer("total_pages").notNull(),
    currentPage: integer("current_page").notNull().default(0),
    wordCount: integer("word_count"),
    wordsPerPage: integer("words_per_page"),
    campaignSlug: text("campaign_slug"),
    eraId: integer("era_id").references(() => eras.id),
    status: text("status", { enum: ["to_read", "reading", "finished"] })
      .notNull()
      .default("to_read"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_books_user").on(table.userId),
    index("idx_books_catalog").on(table.catalogBookId),
    uniqueIndex("ux_books_user_catalog").on(table.userId, table.catalogBookId),
  ],
);

export const timelineEntries = pgTable(
  "timeline_entries",
  {
    id: serial("id").primaryKey(),
    kind: text("kind", { enum: ["book", "event", "person", "note"] }).notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    content: text("content"),
    year: integer("year").notNull(),
    month: integer("month"),
    day: integer("day"),
    yearEnd: integer("year_end"),
    monthEnd: integer("month_end"),
    dayEnd: integer("day_end"),
    eraId: integer("era_id").references(() => eras.id),
    bookId: integer("book_id").references(() => books.id),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_entries_year").on(table.year),
    index("idx_entries_kind").on(table.kind),
    index("idx_entries_era").on(table.eraId),
  ],
);

export const entryLinks = pgTable(
  "entry_links",
  {
    id: serial("id").primaryKey(),
    sourceEntryId: integer("source_entry_id")
      .notNull()
      .references(() => timelineEntries.id, { onDelete: "cascade" }),
    targetEntryId: integer("target_entry_id")
      .notNull()
      .references(() => timelineEntries.id, { onDelete: "cascade" }),
    linkType: text("link_type").notNull().default("relates_to"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("ux_entry_links_unique").on(
      table.sourceEntryId,
      table.targetEntryId,
      table.linkType,
    ),
    index("idx_entry_links_source").on(table.sourceEntryId),
    index("idx_entry_links_target").on(table.targetEntryId),
  ],
);

export const RARITY_ENUM = ["common", "uncommon", "rare", "epic", "legendary", "mythic"] as const;
export const ARCHETYPE_ENUM = ["warrior", "scholar", "monarch", "merchant", "sailor", "leader"] as const;
export const ABILITY_EFFECT_ENUM = [
  "flat_attack",
  "flat_defense",
  "vs_higher_rarity_attack",
  "vs_lower_rarity_attack",
  "scry",
  "search_deck",
  "discard_to_hand",
  "discard_draw",
  "heal_unit",
  "add_influence",
  "remove_influence",
  "cost_reduction",
  "block_influence_gain",
  "replace_location",
  "draw_card",
  "epidemic",
  "treaty",
  "revolution",
  "trade_route",
  "reform",
  "forced_hand",
  "forced_discard",
  "exhaust_unit",
] as const;
export const ABILITY_TRIGGER_ENUM = ["deploy", "death", "campaign_start"] as const;
export const CARD_TYPE_ENUM = ["character", "location", "unit", "event"] as const;
export const USER_ROLE_ENUM = ["user", "admin"] as const;
export const DISPLAY_NAME_AS_ENUM = [
  "email",
  "first_name",
  "last_name",
  "nickname",
  "full_name",
] as const;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: USER_ROLE_ENUM }).notNull().default("user"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  nickname: text("nickname"),
  displayNameAs: text("display_name_as", { enum: DISPLAY_NAME_AS_ENUM })
    .notNull()
    .default("email"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  eraId: integer("era_id")
    .notNull()
    .references(() => eras.id),
  name: text("name").notNull(),
  flavorText: text("flavor_text"),
  seed: text("seed").notNull().unique(),
  rarity: text("rarity", { enum: RARITY_ENUM }).notNull(),
  cardType: text("card_type", { enum: CARD_TYPE_ENUM }).notNull().default("character"),
  cost: integer("cost").notNull(),
  archetype: text("archetype", { enum: ARCHETYPE_ENUM }),
  imageUrl: text("image_url"),
  imageFocusX: integer("image_focus_x").notNull().default(50),
  imageFocusY: integer("image_focus_y").notNull().default(50),
  imageScale: integer("image_scale").notNull().default(100),
  holographic: boolean("holographic").notNull().default(false),
  attack: integer("attack").notNull().default(0),
  defense: integer("defense").notNull().default(0),
  abilityName: text("ability_name"),
  abilityEffect: text("ability_effect", { enum: ABILITY_EFFECT_ENUM }),
  abilityValue: integer("ability_value"),
  abilityTrigger: text("ability_trigger", { enum: ABILITY_TRIGGER_ENUM }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const catalogBookCards = pgTable(
  "catalog_book_cards",
  {
    id: serial("id").primaryKey(),
    catalogBookId: integer("catalog_book_id")
      .notNull()
      .references(() => catalogBooks.id, { onDelete: "cascade" }),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("ux_catalog_book_cards_book_character").on(
      table.catalogBookId,
      table.characterId,
    ),
    index("idx_catalog_book_cards_book").on(table.catalogBookId),
  ],
);

export const CATALOG_DECK_KIND_ENUM = ["starter", "themed"] as const;

export const catalogDecks = pgTable(
  "catalog_decks",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    eraId: integer("era_id").references(() => eras.id),
    deckKind: text("deck_kind", { enum: CATALOG_DECK_KIND_ENUM }).notNull().default("themed"),
    price: integer("price").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_catalog_decks_kind").on(table.deckKind),
    index("idx_catalog_decks_active").on(table.active),
  ],
);

export const catalogDeckCards = pgTable(
  "catalog_deck_cards",
  {
    id: serial("id").primaryKey(),
    catalogDeckId: integer("catalog_deck_id")
      .notNull()
      .references(() => catalogDecks.id, { onDelete: "cascade" }),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
  },
  (table) => [
    uniqueIndex("ux_catalog_deck_cards_deck_character").on(
      table.catalogDeckId,
      table.characterId,
    ),
    index("idx_catalog_deck_cards_deck").on(table.catalogDeckId),
  ],
);

export const userCharacters = pgTable(
  "user_characters",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true }).notNull().defaultNow(),
    quantity: integer("quantity").notNull().default(1),
    sourceBookId: integer("source_book_id").references(() => books.id),
  },
  (table) => [
    uniqueIndex("ux_user_characters_user_character").on(table.userId, table.characterId),
    index("idx_user_characters_user").on(table.userId),
  ],
);

export const boosterPacks = pgTable("booster_packs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  cardsPerPack: integer("cards_per_pack").notNull().default(10),
  price: integer("price").notNull(),
  eraId: integer("era_id").references(() => eras.id), // null = any era
  cardType: text("card_type", { enum: CARD_TYPE_ENUM }), // null = either type
  weightCommon: integer("weight_common").notNull(),
  weightUncommon: integer("weight_uncommon").notNull(),
  weightRare: integer("weight_rare").notNull(),
  weightEpic: integer("weight_epic").notNull(),
  weightLegendary: integer("weight_legendary").notNull(),
  weightMythic: integer("weight_mythic").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const POINTS_LEDGER_TYPE_ENUM = [
  "milestone_25",
  "milestone_50",
  "milestone_75",
  "milestone_100",
  "session_read",
  "spend_unlock",
  "spend_pack",
  "manual_adjust",
  "cap_clawback",
  "verification_hold",
] as const;

export const POINTS_LEDGER_STATUS_ENUM = ["pending", "settled", "held", "reversed"] as const;

export const pointsLedger = pgTable(
  "points_ledger",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bookId: integer("book_id").references(() => books.id),
    eraId: integer("era_id").references(() => eras.id),
    sessionId: integer("session_id"),
    type: text("type", { enum: POINTS_LEDGER_TYPE_ENUM }).notNull(),
    points: integer("points").notNull(),
    pointsRequested: integer("points_requested"),
    status: text("status", { enum: POINTS_LEDGER_STATUS_ENUM }).notNull().default("settled"),
    metadata: text("metadata"),
    characterId: integer("character_id").references(() => characters.id),
    packConfigId: integer("pack_config_id").references(() => boosterPacks.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("ux_points_book_milestone")
      .on(table.bookId, table.type)
      .where(sql`${table.type} like 'milestone_%'`),
    index("idx_points_ledger_user").on(table.userId),
    index("idx_points_ledger_session").on(table.sessionId),
  ],
);

export const READING_SESSION_STATUS_ENUM = [
  "active",
  "paused",
  "completed",
  "abandoned",
  "flagged",
] as const;

export const READING_SESSION_SOURCE_ENUM = ["timer", "manual_override", "admin"] as const;

export const readingSessions = pgTable(
  "reading_sessions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bookId: integer("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    status: text("status", { enum: READING_SESSION_STATUS_ENUM }).notNull().default("active"),
    startPage: integer("start_page").notNull(),
    endPage: integer("end_page"),
    pagesLogged: integer("pages_logged").notNull().default(0),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }),
    activeSeconds: integer("active_seconds").notNull().default(0),
    pausedSeconds: integer("paused_seconds").notNull().default(0),
    lastHeartbeat: timestamp("last_heartbeat", { withTimezone: true }).notNull(),
    clientToken: text("client_token").notNull().unique(),
    source: text("source", { enum: READING_SESSION_SOURCE_ENUM }).notNull().default("timer"),
    pagesPerMinX100: integer("pages_per_min_x100"),
    wpmEstimate: integer("wpm_estimate"),
    velocityScore: integer("velocity_score"),
    flagReason: text("flag_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_reading_sessions_user").on(table.userId),
    index("idx_reading_sessions_book").on(table.bookId),
    index("idx_reading_sessions_status").on(table.status),
    uniqueIndex("ux_reading_sessions_active_book")
      .on(table.bookId)
      .where(sql`${table.status} = 'active'`),
  ],
);

export const userEraStats = pgTable(
  "user_era_stats",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eraId: integer("era_id")
      .notNull()
      .references(() => eras.id, { onDelete: "cascade" }),
    pointsBalance: integer("points_balance").notNull().default(0),
    totalPointsEarned: integer("total_points_earned").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("ux_user_era_stats_user_era").on(table.userId, table.eraId),
    index("idx_user_era_stats_user").on(table.userId),
  ],
);

export const userPointCaps = pgTable("user_point_caps", {
  userId: integer("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  dailyEarned: integer("daily_earned").notNull().default(0),
  dailyCap: integer("daily_cap").notNull().default(150),
  dailyResetAt: timestamp("daily_reset_at", { withTimezone: true }).notNull(),
  weeklyEarned: integer("weekly_earned").notNull().default(0),
  weeklyCap: integer("weekly_cap").notNull().default(600),
  weeklyResetAt: timestamp("weekly_reset_at", { withTimezone: true }).notNull(),
  trustScore: integer("trust_score").notNull().default(100),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const VERIFICATION_QUEUE_STATUS_ENUM = [
  "pending",
  "approved",
  "rejected",
  "expired",
] as const;

export const verificationQueue = pgTable(
  "verification_queue",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionId: integer("session_id").references(() => readingSessions.id),
    ledgerId: integer("ledger_id").references(() => pointsLedger.id),
    reason: text("reason").notNull(),
    payload: text("payload").notNull(),
    status: text("status", { enum: VERIFICATION_QUEUE_STATUS_ENUM })
      .notNull()
      .default("pending"),
    reviewedBy: integer("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_verification_queue_user").on(table.userId),
    index("idx_verification_queue_status").on(table.status),
  ],
);

export const antiCheatEvents = pgTable(
  "anti_cheat_events",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    severity: integer("severity").notNull().default(1),
    sessionId: integer("session_id").references(() => readingSessions.id),
    details: text("details"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_anti_cheat_events_user").on(table.userId)],
);

export const userStats = pgTable(
  "user_stats",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    pointsBalance: integer("points_balance").notNull().default(0),
    totalPointsEarned: integer("total_points_earned").notNull().default(0),
    booksFinished: integer("books_finished").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("ux_user_stats_user").on(table.userId)],
);

export const userEras = pgTable(
  "user_eras",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eraId: integer("era_id")
      .notNull()
      .references(() => eras.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("ux_user_eras_user_era").on(table.userId, table.eraId),
    index("idx_user_eras_user").on(table.userId),
  ],
);

export const eraCampaigns = pgTable("era_campaigns", {
  id: serial("id").primaryKey(),
  eraId: integer("era_id")
    .notNull()
    .references(() => eras.id, { onDelete: "cascade" })
    .unique(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  themeJson: text("theme_json").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userCampaignProgress = pgTable(
  "user_campaign_progress",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eraId: integer("era_id")
      .notNull()
      .references(() => eras.id, { onDelete: "cascade" }),
    nodesUnlocked: text("nodes_unlocked").notNull().default("[]"),
    currentNode: text("current_node"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.eraId] }),
    index("idx_user_campaign_progress_user").on(table.userId),
  ],
);

export const gameRules = pgTable("game_rules", {
  id: integer("id").primaryKey(),
  milestonesJson: text("milestones_json").notNull(),
  pointsPerMilestone: integer("points_per_milestone").notNull(),
  dailyPointCap: integer("daily_point_cap").notNull(),
  weeklyPointCap: integer("weekly_point_cap").notNull(),
  packGeneralMultiplier: doublePrecision("pack_general_multiplier").notNull(),
  minSecondsPerPage: integer("min_seconds_per_page").notNull(),
  softSecondsPerPage: integer("soft_seconds_per_page").notNull(),
  maxWpm: integer("max_wpm").notNull(),
  softWpm: integer("soft_wpm").notNull(),
  bulkPageJumpThreshold: integer("bulk_page_jump_threshold").notNull(),
  minTrustForInstantAward: integer("min_trust_for_instant_award").notNull(),
  trustDecayPerFlag: integer("trust_decay_per_flag").notNull(),
  trustGainOnApprove: integer("trust_gain_on_approve").notNull(),
  battleRulesJson: text("battle_rules_json"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userDecks = pgTable(
  "user_decks",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_user_decks_user").on(table.userId)],
);

export const userDeckCards = pgTable(
  "user_deck_cards",
  {
    id: serial("id").primaryKey(),
    deckId: integer("deck_id")
      .notNull()
      .references(() => userDecks.id, { onDelete: "cascade" }),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
  },
  (table) => [
    uniqueIndex("ux_user_deck_cards_deck_character").on(table.deckId, table.characterId),
    index("idx_user_deck_cards_deck").on(table.deckId),
  ],
);

export const MATCH_STATUS_ENUM = ["active", "won", "lost", "abandoned"] as const;

export const matches = pgTable(
  "matches",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    deckId: integer("deck_id")
      .notNull()
      .references(() => userDecks.id, { onDelete: "cascade" }),
    status: text("status", { enum: MATCH_STATUS_ENUM }).notNull().default("active"),
    phase: text("phase").notNull().default("logistics"),
    activePlayer: text("active_player").notNull().default("player"),
    turnNumber: integer("turn_number").notNull().default(1),
    stateJson: text("state_json").notNull(),
    winner: text("winner"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_matches_user").on(table.userId),
    index("idx_matches_status").on(table.status),
  ],
);
