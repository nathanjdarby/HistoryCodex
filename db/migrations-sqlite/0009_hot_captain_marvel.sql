ALTER TABLE `booster_packs` ADD `image_url` text;--> statement-breakpoint
ALTER TABLE `booster_packs` ADD `cards_per_pack` integer DEFAULT 1 NOT NULL;