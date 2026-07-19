ALTER TABLE `game_rules` ADD COLUMN `battle_rules_json` text;
--> statement-breakpoint
CREATE TABLE `user_decks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_user_decks_user` ON `user_decks` (`user_id`);
--> statement-breakpoint
CREATE TABLE `user_deck_cards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`deck_id` integer NOT NULL,
	`character_id` integer NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`deck_id`) REFERENCES `user_decks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_user_deck_cards_deck_character` ON `user_deck_cards` (`deck_id`,`character_id`);
--> statement-breakpoint
CREATE INDEX `idx_user_deck_cards_deck` ON `user_deck_cards` (`deck_id`);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`deck_id` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`phase` text DEFAULT 'logistics' NOT NULL,
	`active_player` text DEFAULT 'player' NOT NULL,
	`turn_number` integer DEFAULT 1 NOT NULL,
	`state_json` text NOT NULL,
	`winner` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`deck_id`) REFERENCES `user_decks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_matches_user` ON `matches` (`user_id`);
--> statement-breakpoint
CREATE INDEX `idx_matches_status` ON `matches` (`status`);
--> statement-breakpoint
UPDATE `game_rules` SET `battle_rules_json` = '{"cpTrack":[50,100,150,200,300],"cpCap":300,"deckSize":40,"openingHandSize":5,"maxCopiesPerCard":3,"activeLaneCount":3,"influenceToCapture":3,"locationsToWin":3,"merchantRefundCp":20,"monarchAuraAttack":10,"maxEventsPerTurn":1}' WHERE `id` = 1;
