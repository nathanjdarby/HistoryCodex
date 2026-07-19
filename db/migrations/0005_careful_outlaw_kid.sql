ALTER TABLE `booster_packs` ADD `card_type` text;--> statement-breakpoint
ALTER TABLE `characters` ADD `card_type` text DEFAULT 'character' NOT NULL;--> statement-breakpoint
ALTER TABLE `characters` ADD `holographic` integer DEFAULT false NOT NULL;