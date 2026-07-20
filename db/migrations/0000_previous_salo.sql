CREATE TABLE "anti_cheat_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"event_type" text NOT NULL,
	"severity" integer DEFAULT 1 NOT NULL,
	"session_id" integer,
	"details" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"catalog_book_id" integer NOT NULL,
	"title" text NOT NULL,
	"author" text,
	"isbn" text,
	"open_library_id" text,
	"cover_url" text,
	"summary" text,
	"total_pages" integer NOT NULL,
	"current_page" integer DEFAULT 0 NOT NULL,
	"word_count" integer,
	"words_per_page" integer,
	"campaign_slug" text,
	"era_id" integer,
	"status" text DEFAULT 'to_read' NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booster_packs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image_url" text,
	"cards_per_pack" integer DEFAULT 10 NOT NULL,
	"price" integer NOT NULL,
	"era_id" integer,
	"card_type" text,
	"weight_common" integer NOT NULL,
	"weight_uncommon" integer NOT NULL,
	"weight_rare" integer NOT NULL,
	"weight_epic" integer NOT NULL,
	"weight_legendary" integer NOT NULL,
	"weight_mythic" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_book_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"catalog_book_id" integer NOT NULL,
	"character_id" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_books" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"author" text,
	"isbn" text,
	"open_library_id" text,
	"cover_url" text,
	"summary" text,
	"total_pages" integer NOT NULL,
	"word_count" integer,
	"words_per_page" integer,
	"era_id" integer,
	"timeline_year" integer,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_deck_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"catalog_deck_id" integer NOT NULL,
	"character_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_decks" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image_url" text,
	"era_id" integer,
	"deck_kind" text DEFAULT 'themed' NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" serial PRIMARY KEY NOT NULL,
	"era_id" integer NOT NULL,
	"name" text NOT NULL,
	"flavor_text" text,
	"seed" text NOT NULL,
	"rarity" text NOT NULL,
	"card_type" text DEFAULT 'character' NOT NULL,
	"cost" integer NOT NULL,
	"archetype" text,
	"image_url" text,
	"image_focus_x" integer DEFAULT 50 NOT NULL,
	"image_focus_y" integer DEFAULT 50 NOT NULL,
	"image_scale" integer DEFAULT 100 NOT NULL,
	"holographic" boolean DEFAULT false NOT NULL,
	"attack" integer DEFAULT 0 NOT NULL,
	"defense" integer DEFAULT 0 NOT NULL,
	"ability_name" text,
	"ability_effect" text,
	"ability_value" integer,
	"ability_trigger" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "characters_seed_unique" UNIQUE("seed")
);
--> statement-breakpoint
CREATE TABLE "entry_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_entry_id" integer NOT NULL,
	"target_entry_id" integer NOT NULL,
	"link_type" text DEFAULT 'relates_to' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "era_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"era_id" integer NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"theme_json" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "era_campaigns_era_id_unique" UNIQUE("era_id"),
	CONSTRAINT "era_campaigns_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "eras" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"start_year" integer NOT NULL,
	"end_year" integer NOT NULL,
	"color_primary" text NOT NULL,
	"color_secondary" text NOT NULL,
	"region" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "eras_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "game_rules" (
	"id" integer PRIMARY KEY NOT NULL,
	"milestones_json" text NOT NULL,
	"points_per_milestone" integer NOT NULL,
	"daily_point_cap" integer NOT NULL,
	"weekly_point_cap" integer NOT NULL,
	"pack_general_multiplier" double precision NOT NULL,
	"min_seconds_per_page" integer NOT NULL,
	"soft_seconds_per_page" integer NOT NULL,
	"max_wpm" integer NOT NULL,
	"soft_wpm" integer NOT NULL,
	"bulk_page_jump_threshold" integer NOT NULL,
	"min_trust_for_instant_award" integer NOT NULL,
	"trust_decay_per_flag" integer NOT NULL,
	"trust_gain_on_approve" integer NOT NULL,
	"battle_rules_json" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"deck_id" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"phase" text DEFAULT 'logistics' NOT NULL,
	"active_player" text DEFAULT 'player' NOT NULL,
	"turn_number" integer DEFAULT 1 NOT NULL,
	"state_json" text NOT NULL,
	"winner" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "points_ledger" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"book_id" integer,
	"era_id" integer,
	"session_id" integer,
	"type" text NOT NULL,
	"points" integer NOT NULL,
	"points_requested" integer,
	"status" text DEFAULT 'settled' NOT NULL,
	"metadata" text,
	"character_id" integer,
	"pack_config_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reading_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"book_id" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"start_page" integer NOT NULL,
	"end_page" integer,
	"pages_logged" integer DEFAULT 0 NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone,
	"active_seconds" integer DEFAULT 0 NOT NULL,
	"paused_seconds" integer DEFAULT 0 NOT NULL,
	"last_heartbeat" timestamp with time zone NOT NULL,
	"client_token" text NOT NULL,
	"source" text DEFAULT 'timer' NOT NULL,
	"pages_per_min_x100" integer,
	"wpm_estimate" integer,
	"velocity_score" integer,
	"flag_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reading_sessions_client_token_unique" UNIQUE("client_token")
);
--> statement-breakpoint
CREATE TABLE "timeline_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"content" text,
	"year" integer NOT NULL,
	"month" integer,
	"day" integer,
	"year_end" integer,
	"month_end" integer,
	"day_end" integer,
	"era_id" integer,
	"book_id" integer,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_campaign_progress" (
	"user_id" integer NOT NULL,
	"era_id" integer NOT NULL,
	"nodes_unlocked" text DEFAULT '[]' NOT NULL,
	"current_node" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_campaign_progress_user_id_era_id_pk" PRIMARY KEY("user_id","era_id")
);
--> statement-breakpoint
CREATE TABLE "user_characters" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"character_id" integer NOT NULL,
	"unlocked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"source_book_id" integer
);
--> statement-breakpoint
CREATE TABLE "user_deck_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"deck_id" integer NOT NULL,
	"character_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_decks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_era_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"era_id" integer NOT NULL,
	"points_balance" integer DEFAULT 0 NOT NULL,
	"total_points_earned" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_eras" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"era_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_point_caps" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"daily_earned" integer DEFAULT 0 NOT NULL,
	"daily_cap" integer DEFAULT 150 NOT NULL,
	"daily_reset_at" timestamp with time zone NOT NULL,
	"weekly_earned" integer DEFAULT 0 NOT NULL,
	"weekly_cap" integer DEFAULT 600 NOT NULL,
	"weekly_reset_at" timestamp with time zone NOT NULL,
	"trust_score" integer DEFAULT 100 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"points_balance" integer DEFAULT 0 NOT NULL,
	"total_points_earned" integer DEFAULT 0 NOT NULL,
	"books_finished" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"first_name" text,
	"last_name" text,
	"nickname" text,
	"display_name_as" text DEFAULT 'email' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"session_id" integer,
	"ledger_id" integer,
	"reason" text NOT NULL,
	"payload" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" integer,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "anti_cheat_events" ADD CONSTRAINT "anti_cheat_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anti_cheat_events" ADD CONSTRAINT "anti_cheat_events_session_id_reading_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."reading_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_catalog_book_id_catalog_books_id_fk" FOREIGN KEY ("catalog_book_id") REFERENCES "public"."catalog_books"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_era_id_eras_id_fk" FOREIGN KEY ("era_id") REFERENCES "public"."eras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booster_packs" ADD CONSTRAINT "booster_packs_era_id_eras_id_fk" FOREIGN KEY ("era_id") REFERENCES "public"."eras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_book_cards" ADD CONSTRAINT "catalog_book_cards_catalog_book_id_catalog_books_id_fk" FOREIGN KEY ("catalog_book_id") REFERENCES "public"."catalog_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_book_cards" ADD CONSTRAINT "catalog_book_cards_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_books" ADD CONSTRAINT "catalog_books_era_id_eras_id_fk" FOREIGN KEY ("era_id") REFERENCES "public"."eras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_deck_cards" ADD CONSTRAINT "catalog_deck_cards_catalog_deck_id_catalog_decks_id_fk" FOREIGN KEY ("catalog_deck_id") REFERENCES "public"."catalog_decks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_deck_cards" ADD CONSTRAINT "catalog_deck_cards_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_decks" ADD CONSTRAINT "catalog_decks_era_id_eras_id_fk" FOREIGN KEY ("era_id") REFERENCES "public"."eras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_era_id_eras_id_fk" FOREIGN KEY ("era_id") REFERENCES "public"."eras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_links" ADD CONSTRAINT "entry_links_source_entry_id_timeline_entries_id_fk" FOREIGN KEY ("source_entry_id") REFERENCES "public"."timeline_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_links" ADD CONSTRAINT "entry_links_target_entry_id_timeline_entries_id_fk" FOREIGN KEY ("target_entry_id") REFERENCES "public"."timeline_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "era_campaigns" ADD CONSTRAINT "era_campaigns_era_id_eras_id_fk" FOREIGN KEY ("era_id") REFERENCES "public"."eras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_deck_id_user_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."user_decks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_era_id_eras_id_fk" FOREIGN KEY ("era_id") REFERENCES "public"."eras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_pack_config_id_booster_packs_id_fk" FOREIGN KEY ("pack_config_id") REFERENCES "public"."booster_packs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_sessions" ADD CONSTRAINT "reading_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_sessions" ADD CONSTRAINT "reading_sessions_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_entries" ADD CONSTRAINT "timeline_entries_era_id_eras_id_fk" FOREIGN KEY ("era_id") REFERENCES "public"."eras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_entries" ADD CONSTRAINT "timeline_entries_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_campaign_progress" ADD CONSTRAINT "user_campaign_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_campaign_progress" ADD CONSTRAINT "user_campaign_progress_era_id_eras_id_fk" FOREIGN KEY ("era_id") REFERENCES "public"."eras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_characters" ADD CONSTRAINT "user_characters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_characters" ADD CONSTRAINT "user_characters_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_characters" ADD CONSTRAINT "user_characters_source_book_id_books_id_fk" FOREIGN KEY ("source_book_id") REFERENCES "public"."books"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_deck_cards" ADD CONSTRAINT "user_deck_cards_deck_id_user_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."user_decks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_deck_cards" ADD CONSTRAINT "user_deck_cards_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_decks" ADD CONSTRAINT "user_decks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_era_stats" ADD CONSTRAINT "user_era_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_era_stats" ADD CONSTRAINT "user_era_stats_era_id_eras_id_fk" FOREIGN KEY ("era_id") REFERENCES "public"."eras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_eras" ADD CONSTRAINT "user_eras_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_eras" ADD CONSTRAINT "user_eras_era_id_eras_id_fk" FOREIGN KEY ("era_id") REFERENCES "public"."eras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_point_caps" ADD CONSTRAINT "user_point_caps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_queue" ADD CONSTRAINT "verification_queue_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_queue" ADD CONSTRAINT "verification_queue_session_id_reading_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."reading_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_queue" ADD CONSTRAINT "verification_queue_ledger_id_points_ledger_id_fk" FOREIGN KEY ("ledger_id") REFERENCES "public"."points_ledger"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_queue" ADD CONSTRAINT "verification_queue_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_anti_cheat_events_user" ON "anti_cheat_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_books_user" ON "books" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_books_catalog" ON "books" USING btree ("catalog_book_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_books_user_catalog" ON "books" USING btree ("user_id","catalog_book_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_catalog_book_cards_book_character" ON "catalog_book_cards" USING btree ("catalog_book_id","character_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_book_cards_book" ON "catalog_book_cards" USING btree ("catalog_book_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_books_era" ON "catalog_books" USING btree ("era_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_books_active" ON "catalog_books" USING btree ("active");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_catalog_deck_cards_deck_character" ON "catalog_deck_cards" USING btree ("catalog_deck_id","character_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_deck_cards_deck" ON "catalog_deck_cards" USING btree ("catalog_deck_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_decks_kind" ON "catalog_decks" USING btree ("deck_kind");--> statement-breakpoint
CREATE INDEX "idx_catalog_decks_active" ON "catalog_decks" USING btree ("active");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_entry_links_unique" ON "entry_links" USING btree ("source_entry_id","target_entry_id","link_type");--> statement-breakpoint
CREATE INDEX "idx_entry_links_source" ON "entry_links" USING btree ("source_entry_id");--> statement-breakpoint
CREATE INDEX "idx_entry_links_target" ON "entry_links" USING btree ("target_entry_id");--> statement-breakpoint
CREATE INDEX "idx_matches_user" ON "matches" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_matches_status" ON "matches" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_points_book_milestone" ON "points_ledger" USING btree ("book_id","type") WHERE "points_ledger"."type" like 'milestone_%';--> statement-breakpoint
CREATE INDEX "idx_points_ledger_user" ON "points_ledger" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_points_ledger_session" ON "points_ledger" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_reading_sessions_user" ON "reading_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_reading_sessions_book" ON "reading_sessions" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "idx_reading_sessions_status" ON "reading_sessions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_reading_sessions_active_book" ON "reading_sessions" USING btree ("book_id") WHERE "reading_sessions"."status" = 'active';--> statement-breakpoint
CREATE INDEX "idx_entries_year" ON "timeline_entries" USING btree ("year");--> statement-breakpoint
CREATE INDEX "idx_entries_kind" ON "timeline_entries" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "idx_entries_era" ON "timeline_entries" USING btree ("era_id");--> statement-breakpoint
CREATE INDEX "idx_user_campaign_progress_user" ON "user_campaign_progress" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_user_characters_user_character" ON "user_characters" USING btree ("user_id","character_id");--> statement-breakpoint
CREATE INDEX "idx_user_characters_user" ON "user_characters" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_user_deck_cards_deck_character" ON "user_deck_cards" USING btree ("deck_id","character_id");--> statement-breakpoint
CREATE INDEX "idx_user_deck_cards_deck" ON "user_deck_cards" USING btree ("deck_id");--> statement-breakpoint
CREATE INDEX "idx_user_decks_user" ON "user_decks" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_user_era_stats_user_era" ON "user_era_stats" USING btree ("user_id","era_id");--> statement-breakpoint
CREATE INDEX "idx_user_era_stats_user" ON "user_era_stats" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_user_eras_user_era" ON "user_eras" USING btree ("user_id","era_id");--> statement-breakpoint
CREATE INDEX "idx_user_eras_user" ON "user_eras" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_user_stats_user" ON "user_stats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_verification_queue_user" ON "verification_queue" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_verification_queue_status" ON "verification_queue" USING btree ("status");