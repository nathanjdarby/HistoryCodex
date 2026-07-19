CREATE TABLE `battles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_character_id` integer,
	`opponent_character_id` integer,
	`player_name` text NOT NULL,
	`opponent_name` text NOT NULL,
	`player_rarity` text NOT NULL,
	`opponent_rarity` text NOT NULL,
	`player_archetype` text,
	`opponent_archetype` text,
	`player_score` integer NOT NULL,
	`opponent_score` integer NOT NULL,
	`result` text NOT NULL,
	`points_awarded` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`player_character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`opponent_character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_battles_created` ON `battles` (`created_at`);--> statement-breakpoint
ALTER TABLE `characters` ADD `attack` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `characters` ADD `defense` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `characters` ADD `ability_name` text;--> statement-breakpoint
ALTER TABLE `characters` ADD `ability_effect` text;--> statement-breakpoint
ALTER TABLE `characters` ADD `ability_value` integer;