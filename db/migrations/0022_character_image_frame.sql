-- Per-card image framing: focal point (0–100) and zoom scale (100 = default cover).
ALTER TABLE `characters` ADD `image_focus_x` integer DEFAULT 50 NOT NULL;
--> statement-breakpoint
ALTER TABLE `characters` ADD `image_focus_y` integer DEFAULT 50 NOT NULL;
--> statement-breakpoint
ALTER TABLE `characters` ADD `image_scale` integer DEFAULT 100 NOT NULL;
