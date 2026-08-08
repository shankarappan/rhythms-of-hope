import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const eventInventory = sqliteTable("event_inventory", {
  id: text("id").primaryKey(),
  capacity: integer("capacity").notNull(),
  complimentaryCapacity: integer("complimentary_capacity").notNull(),
  soldPaid: integer("sold_paid").notNull().default(0),
  soldComplimentary: integer("sold_complimentary").notNull().default(0),
  reservedPaid: integer("reserved_paid").notNull().default(0),
  reservedComplimentary: integer("reserved_complimentary").notNull().default(0),
  lastPurchaseAt: text("last_purchase_at"),
});

export const reservations = sqliteTable("reservations", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  quantity: integer("quantity").notNull(),
  adultQuantity: integer("adult_quantity").notNull().default(0),
  kidsQuantity: integer("kids_quantity").notNull().default(0),
  expiresAt: integer("expires_at").notNull(),
  stripeSessionId: text("stripe_session_id").unique(),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").notNull(),
});

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  stripeSessionId: text("stripe_session_id").notNull().unique(),
  paymentIntentId: text("payment_intent_id"),
  buyerName: text("buyer_name").notNull(),
  buyerEmail: text("buyer_email").notNull(),
  quantity: integer("quantity").notNull(),
  adultQuantity: integer("adult_quantity").notNull().default(0),
  kidsQuantity: integer("kids_quantity").notNull().default(0),
  kind: text("kind").notNull(),
  amountTotal: integer("amount_total").notNull(),
  currency: text("currency").notNull(),
  emailStatus: text("email_status").notNull().default("pending"),
  createdAt: text("created_at").notNull(),
});

export const tickets = sqliteTable("tickets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  publicNumber: text("public_number").unique(),
  orderId: text("order_id").notNull(),
  qrToken: text("qr_token").notNull().unique(),
  admissionType: text("admission_type").notNull().default("adult"),
  checkedInAt: text("checked_in_at"),
  createdAt: text("created_at").notNull(),
});

export const webhookEvents = sqliteTable("webhook_events", {
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(),
  processedAt: text("processed_at").notNull(),
});

export const donationAcknowledgements = sqliteTable("donation_acknowledgements", {
  eventId: text("event_id").primaryKey(),
  stripeSessionId: text("stripe_session_id").notNull().unique(),
  buyerName: text("buyer_name").notNull(),
  buyerEmail: text("buyer_email").notNull(),
  amountTotal: integer("amount_total").notNull(),
  currency: text("currency").notNull(),
  emailStatus: text("email_status").notNull().default("pending"),
  createdAt: text("created_at").notNull(),
});

export const merchOrders = sqliteTable("merch_orders", {
  id: text("id").primaryKey(),
  stripeSessionId: text("stripe_session_id").notNull().unique(),
  paymentIntentId: text("payment_intent_id"),
  buyerName: text("buyer_name").notNull(),
  buyerEmail: text("buyer_email").notNull(),
  buyerPhone: text("buyer_phone").notNull().default(""),
  amountTotal: integer("amount_total").notNull(),
  currency: text("currency").notNull(),
  status: text("status").notNull().default("new"),
  emailStatus: text("email_status").notNull().default("pending"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const merchOrderItems = sqliteTable("merch_order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: text("order_id").notNull(),
  audience: text("audience").notNull(),
  colour: text("colour").notNull(),
  size: text("size").notNull(),
  quantity: integer("quantity").notNull(),
  unitAmount: integer("unit_amount").notNull(),
});
