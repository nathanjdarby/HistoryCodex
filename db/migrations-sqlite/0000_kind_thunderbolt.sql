CREATE TABLE `books` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`author` text,
	`isbn` text,
	`open_library_id` text,
	`cover_url` text,
	`total_pages` integer NOT NULL,
	`current_page` integer DEFAULT 0 NOT NULL,
	`era_id` integer,
	`status` text DEFAULT 'to_read' NOT NULL,
	`started_at` integer,
	`finished_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`era_id`) REFERENCES `eras`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `characters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`era_id` integer NOT NULL,
	`name` text NOT NULL,
	`seed` text NOT NULL,
	`rarity` text NOT NULL,
	`cost` integer NOT NULL,
	`archetype` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`era_id`) REFERENCES `eras`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `characters_seed_unique` ON `characters` (`seed`);--> statement-breakpoint
CREATE TABLE `entry_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source_entry_id` integer NOT NULL,
	`target_entry_id` integer NOT NULL,
	`link_type` text DEFAULT 'relates_to' NOT NULL,
	`note` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`source_entry_id`) REFERENCES `timeline_entries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_entry_id`) REFERENCES `timeline_entries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_entry_links_unique` ON `entry_links` (`source_entry_id`,`target_entry_id`,`link_type`);--> statement-breakpoint
CREATE INDEX `idx_entry_links_source` ON `entry_links` (`source_entry_id`);--> statement-breakpoint
CREATE INDEX `idx_entry_links_target` ON `entry_links` (`target_entry_id`);--> statement-breakpoint
CREATE TABLE `eras` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`start_year` integer NOT NULL,
	`end_year` integer NOT NULL,
	`color_primary` text NOT NULL,
	`color_secondary` text NOT NULL,
	`region` text,
	`description` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `eras_slug_unique` ON `eras` (`slug`);--> statement-breakpoint
CREATE TABLE `points_ledger` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`book_id` integer,
	`type` text NOT NULL,
	`points` integer NOT NULL,
	`character_id` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_points_book_milestone` ON `points_ledger` (`book_id`,`type`) WHERE "points_ledger"."type" like 'milestone_%';--> statement-breakpoint
CREATE TABLE `timeline_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`summary` text,
	`content` text,
	`year` integer NOT NULL,
	`year_end` integer,
	`era_id` integer,
	`book_id` integer,
	`image_url` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`era_id`) REFERENCES `eras`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_entries_year` ON `timeline_entries` (`year`);--> statement-breakpoint
CREATE INDEX `idx_entries_kind` ON `timeline_entries` (`kind`);--> statement-breakpoint
CREATE INDEX `idx_entries_era` ON `timeline_entries` (`era_id`);--> statement-breakpoint
CREATE TABLE `user_characters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`character_id` integer NOT NULL,
	`unlocked_at` integer DEFAULT (unixepoch()) NOT NULL,
	`source_book_id` integer,
	FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_characters_character_id_unique` ON `user_characters` (`character_id`);--> statement-breakpoint
CREATE TABLE `user_stats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`points_balance` integer DEFAULT 0 NOT NULL,
	`total_points_earned` integer DEFAULT 0 NOT NULL,
	`books_finished` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
