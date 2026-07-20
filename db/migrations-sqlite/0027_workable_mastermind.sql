CREATE TABLE `catalog_books` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`author` text,
	`isbn` text,
	`open_library_id` text,
	`cover_url` text,
	`summary` text,
	`total_pages` integer NOT NULL,
	`word_count` integer,
	`words_per_page` integer,
	`era_id` integer,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`era_id`) REFERENCES `eras`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_catalog_books_era` ON `catalog_books` (`era_id`);--> statement-breakpoint
CREATE INDEX `idx_catalog_books_active` ON `catalog_books` (`active`);--> statement-breakpoint
ALTER TABLE `books` ADD `catalog_book_id` integer REFERENCES catalog_books(id);--> statement-breakpoint
CREATE INDEX `idx_books_catalog` ON `books` (`catalog_book_id`);
