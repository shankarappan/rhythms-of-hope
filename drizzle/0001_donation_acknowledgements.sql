CREATE TABLE `donation_acknowledgements` (
	`event_id` text PRIMARY KEY NOT NULL,
	`stripe_session_id` text NOT NULL,
	`buyer_name` text NOT NULL,
	`buyer_email` text NOT NULL,
	`amount_total` integer NOT NULL,
	`currency` text NOT NULL,
	`email_status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `donation_acknowledgements_stripe_session_id_unique` ON `donation_acknowledgements` (`stripe_session_id`);
