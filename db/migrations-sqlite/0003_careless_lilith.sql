CREATE TABLE `booster_packs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` integer NOT NULL,
	`era_id` integer,
	`weight_common` integer NOT NULL,
	`weight_uncommon` integer NOT NULL,
	`weight_rare` integer NOT NULL,
	`weight_epic` integer NOT NULL,
	`weight_legendary` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`era_id`) REFERENCES `eras`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `points_ledger` ADD `pack_config_id` integer REFERENCES booster_packs(id);