CREATE TABLE `catalog_book_cards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`catalog_book_id` integer NOT NULL,
	`character_id` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`catalog_book_id`) REFERENCES `catalog_books`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_catalog_book_cards_book_character` ON `catalog_book_cards` (`catalog_book_id`,`character_id`);--> statement-breakpoint
CREATE INDEX `idx_catalog_book_cards_book` ON `catalog_book_cards` (`catalog_book_id`);