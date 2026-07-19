CREATE TABLE `anti_cheat_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`event_type` text NOT NULL,
	`severity` integer DEFAULT 1 NOT NULL,
	`session_id` integer,
	`details` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `reading_sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_anti_cheat_events_user` ON `anti_cheat_events` (`user_id`);--> statement-breakpoint
CREATE TABLE `reading_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`book_id` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`start_page` integer NOT NULL,
	`end_page` integer,
	`pages_logged` integer DEFAULT 0 NOT NULL,
	`start_time` integer NOT NULL,
	`end_time` integer,
	`active_seconds` integer DEFAULT 0 NOT NULL,
	`paused_seconds` integer DEFAULT 0 NOT NULL,
	`last_heartbeat` integer NOT NULL,
	`client_token` text NOT NULL,
	`source` text DEFAULT 'timer' NOT NULL,
	`pages_per_min_x100` integer,
	`wpm_estimate` integer,
	`velocity_score` integer,
	`flag_reason` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reading_sessions_client_token_unique` ON `reading_sessions` (`client_token`);--> statement-breakpoint
CREATE INDEX `idx_reading_sessions_user` ON `reading_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_reading_sessions_book` ON `reading_sessions` (`book_id`);--> statement-breakpoint
CREATE INDEX `idx_reading_sessions_status` ON `reading_sessions` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `ux_reading_sessions_active_book` ON `reading_sessions` (`book_id`) WHERE "reading_sessions"."status" = 'active';--> statement-breakpoint
CREATE TABLE `user_era_stats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`era_id` integer NOT NULL,
	`points_balance` integer DEFAULT 0 NOT NULL,
	`total_points_earned` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`era_id`) REFERENCES `eras`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_user_era_stats_user_era` ON `user_era_stats` (`user_id`,`era_id`);--> statement-breakpoint
CREATE INDEX `idx_user_era_stats_user` ON `user_era_stats` (`user_id`);--> statement-breakpoint
CREATE TABLE `user_point_caps` (
	`user_id` integer PRIMARY KEY NOT NULL,
	`daily_earned` integer DEFAULT 0 NOT NULL,
	`daily_cap` integer DEFAULT 150 NOT NULL,
	`daily_reset_at` integer NOT NULL,
	`weekly_earned` integer DEFAULT 0 NOT NULL,
	`weekly_cap` integer DEFAULT 600 NOT NULL,
	`weekly_reset_at` integer NOT NULL,
	`trust_score` integer DEFAULT 100 NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `verification_queue` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`session_id` integer,
	`ledger_id` integer,
	`reason` text NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewed_by` integer,
	`reviewed_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `reading_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ledger_id`) REFERENCES `points_ledger`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_verification_queue_user` ON `verification_queue` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_verification_queue_status` ON `verification_queue` (`status`);--> statement-breakpoint
ALTER TABLE `books` ADD `word_count` integer;--> statement-breakpoint
ALTER TABLE `books` ADD `words_per_page` integer;--> statement-breakpoint
ALTER TABLE `books` ADD `campaign_slug` text;--> statement-breakpoint
ALTER TABLE `points_ledger` ADD `era_id` integer REFERENCES eras(id);--> statement-breakpoint
ALTER TABLE `points_ledger` ADD `session_id` integer;--> statement-breakpoint
ALTER TABLE `points_ledger` ADD `points_requested` integer;--> statement-breakpoint
ALTER TABLE `points_ledger` ADD `status` text DEFAULT 'settled' NOT NULL;--> statement-breakpoint
ALTER TABLE `points_ledger` ADD `metadata` text;--> statement-breakpoint
CREATE INDEX `idx_points_ledger_session` ON `points_ledger` (`session_id`);