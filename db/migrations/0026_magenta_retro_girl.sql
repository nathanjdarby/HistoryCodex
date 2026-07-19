CREATE TABLE `era_campaigns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`era_id` integer NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`theme_json` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`era_id`) REFERENCES `eras`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `era_campaigns_era_id_unique` ON `era_campaigns` (`era_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `era_campaigns_slug_unique` ON `era_campaigns` (`slug`);--> statement-breakpoint
CREATE TABLE `user_campaign_progress` (
	`user_id` integer NOT NULL,
	`era_id` integer NOT NULL,
	`nodes_unlocked` text DEFAULT '[]' NOT NULL,
	`current_node` text,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`user_id`, `era_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`era_id`) REFERENCES `eras`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_user_campaign_progress_user` ON `user_campaign_progress` (`user_id`);