-- Track how many copies of each card a user owns (booster packs can grant duplicates).
ALTER TABLE `user_characters` ADD `quantity` integer DEFAULT 1 NOT NULL;
