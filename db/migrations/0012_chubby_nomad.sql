CREATE TABLE `user_eras` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`era_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`era_id`) REFERENCES `eras`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `user_eras` (`user_id`, `era_id`, `created_at`)
SELECT `u`.`id`, `e`.`id`, unixepoch()
FROM `users` AS `u`
CROSS JOIN `eras` AS `e`
WHERE `u`.`role` = 'user';--> statement-breakpoint
CREATE UNIQUE INDEX `ux_user_eras_user_era` ON `user_eras` (`user_id`,`era_id`);--> statement-breakpoint
CREATE INDEX `idx_user_eras_user` ON `user_eras` (`user_id`);
