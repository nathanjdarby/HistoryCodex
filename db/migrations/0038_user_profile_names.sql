ALTER TABLE `users` ADD COLUMN `first_name` text;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `last_name` text;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `nickname` text;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `display_name_as` text DEFAULT 'email' NOT NULL;
