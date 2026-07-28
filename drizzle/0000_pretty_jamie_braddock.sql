CREATE TABLE `event_inventory` (
	`id` text PRIMARY KEY NOT NULL,
	`capacity` integer NOT NULL,
	`complimentary_capacity` integer NOT NULL,
	`sold_paid` integer DEFAULT 0 NOT NULL,
	`sold_complimentary` integer DEFAULT 0 NOT NULL,
	`reserved_paid` integer DEFAULT 0 NOT NULL,
	`reserved_complimentary` integer DEFAULT 0 NOT NULL,
	`last_purchase_at` text
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`stripe_session_id` text NOT NULL,
	`payment_intent_id` text,
	`buyer_name` text NOT NULL,
	`buyer_email` text NOT NULL,
	`quantity` integer NOT NULL,
	`kind` text NOT NULL,
	`amount_total` integer NOT NULL,
	`currency` text NOT NULL,
	`email_status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_stripe_session_id_unique` ON `orders` (`stripe_session_id`);--> statement-breakpoint
CREATE TABLE `reservations` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`quantity` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`stripe_session_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reservations_stripe_session_id_unique` ON `reservations` (`stripe_session_id`);--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`public_number` text,
	`order_id` text NOT NULL,
	`qr_token` text NOT NULL,
	`checked_in_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tickets_public_number_unique` ON `tickets` (`public_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `tickets_qr_token_unique` ON `tickets` (`qr_token`);--> statement-breakpoint
CREATE TABLE `webhook_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event_type` text NOT NULL,
	`processed_at` text NOT NULL
);
