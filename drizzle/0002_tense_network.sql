CREATE TABLE `merch_order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` text NOT NULL,
	`audience` text NOT NULL,
	`colour` text NOT NULL,
	`size` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_amount` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `merch_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`stripe_session_id` text NOT NULL,
	`payment_intent_id` text,
	`buyer_name` text NOT NULL,
	`buyer_email` text NOT NULL,
	`buyer_phone` text DEFAULT '' NOT NULL,
	`amount_total` integer NOT NULL,
	`currency` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`email_status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `merch_orders_stripe_session_id_unique` ON `merch_orders` (`stripe_session_id`);
--> statement-breakpoint
CREATE INDEX `idx_merch_orders_status_created` ON `merch_orders` (`status`, `created_at`);
--> statement-breakpoint
CREATE INDEX `idx_merch_items_order` ON `merch_order_items` (`order_id`);
