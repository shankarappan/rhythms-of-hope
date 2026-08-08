ALTER TABLE `orders` ADD `adult_quantity` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `kids_quantity` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE `orders` SET `adult_quantity` = `quantity` WHERE `adult_quantity` = 0 AND `kids_quantity` = 0;--> statement-breakpoint
ALTER TABLE `reservations` ADD `adult_quantity` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `reservations` ADD `kids_quantity` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE `reservations` SET `adult_quantity` = `quantity` WHERE `adult_quantity` = 0 AND `kids_quantity` = 0;--> statement-breakpoint
ALTER TABLE `tickets` ADD `admission_type` text DEFAULT 'adult' NOT NULL;
