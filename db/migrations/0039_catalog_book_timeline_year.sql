ALTER TABLE `catalog_books` ADD `timeline_year` integer;--> statement-breakpoint
UPDATE `catalog_books`
SET `timeline_year` = (
  SELECT `start_year` FROM `eras` WHERE `eras`.`id` = `catalog_books`.`era_id`
)
WHERE `era_id` IS NOT NULL AND `timeline_year` IS NULL;
