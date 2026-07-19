DROP INDEX `user_characters_character_id_unique`;--> statement-breakpoint
ALTER TABLE `user_characters` ADD `user_id` integer REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `battles` ADD `user_id` integer REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `books` ADD `user_id` integer REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `points_ledger` ADD `user_id` integer REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `user_stats` ADD `user_id` integer REFERENCES users(id);--> statement-breakpoint
UPDATE `user_stats`
SET `user_id` = (
  SELECT `id` FROM `users` WHERE `role` = 'user' ORDER BY `id` LIMIT 1
)
WHERE `user_id` IS NULL;--> statement-breakpoint
UPDATE `user_stats`
SET `user_id` = (SELECT `id` FROM `users` ORDER BY `id` LIMIT 1)
WHERE `user_id` IS NULL;--> statement-breakpoint
INSERT INTO `user_stats` (`user_id`, `points_balance`, `total_points_earned`, `books_finished`, `updated_at`)
SELECT
  `u`.`id`,
  0,
  0,
  0,
  unixepoch()
FROM `users` AS `u`
WHERE NOT EXISTS (
  SELECT 1 FROM `user_stats` AS `s` WHERE `s`.`user_id` = `u`.`id`
);--> statement-breakpoint
UPDATE `books`
SET `user_id` = (
  SELECT `user_id` FROM `user_stats` ORDER BY `id` LIMIT 1
)
WHERE `user_id` IS NULL;--> statement-breakpoint
UPDATE `user_characters`
SET `user_id` = (
  SELECT `user_id` FROM `user_stats` ORDER BY `id` LIMIT 1
)
WHERE `user_id` IS NULL;--> statement-breakpoint
UPDATE `points_ledger`
SET `user_id` = (
  SELECT `user_id` FROM `user_stats` ORDER BY `id` LIMIT 1
)
WHERE `user_id` IS NULL;--> statement-breakpoint
UPDATE `battles`
SET `user_id` = (
  SELECT `user_id` FROM `user_stats` ORDER BY `id` LIMIT 1
)
WHERE `user_id` IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `ux_user_characters_user_character` ON `user_characters` (`user_id`,`character_id`);--> statement-breakpoint
CREATE INDEX `idx_user_characters_user` ON `user_characters` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_battles_user` ON `battles` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_books_user` ON `books` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_points_ledger_user` ON `points_ledger` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `ux_user_stats_user` ON `user_stats` (`user_id`);
