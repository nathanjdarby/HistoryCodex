CREATE TABLE `catalog_decks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`image_url` text,
	`era_id` integer,
	`deck_kind` text DEFAULT 'themed' NOT NULL,
	`price` integer DEFAULT 0 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`era_id`) REFERENCES `eras`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_catalog_decks_kind` ON `catalog_decks` (`deck_kind`);
--> statement-breakpoint
CREATE INDEX `idx_catalog_decks_active` ON `catalog_decks` (`active`);
--> statement-breakpoint
CREATE TABLE `catalog_deck_cards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`catalog_deck_id` integer NOT NULL,
	`character_id` integer NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`catalog_deck_id`) REFERENCES `catalog_decks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_catalog_deck_cards_deck_character` ON `catalog_deck_cards` (`catalog_deck_id`,`character_id`);
--> statement-breakpoint
CREATE INDEX `idx_catalog_deck_cards_deck` ON `catalog_deck_cards` (`catalog_deck_id`);
