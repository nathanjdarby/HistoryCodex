ALTER TABLE "books" ADD COLUMN "consumption_format" text DEFAULT 'print' NOT NULL;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "edition_total_pages" integer;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "total_duration_seconds" integer;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "current_position_seconds" integer DEFAULT 0 NOT NULL;
