import { getRuntimeEnv } from "@/db";
import {
  ADULT_TICKET_PRICE_CENTS,
  BOOKING_FEE_CENTS,
  CAPACITY,
  COMPLIMENTARY_CAPACITY,
  EVENT_ID,
  KIDS_TICKET_PRICE_CENTS,
  PAID_CAPACITY,
  ticketNumber,
  type TicketKind,
  type AdmissionType,
} from "./event-config";
import { randomToken } from "./encoding";
import type { CheckoutSession } from "./stripe";

type ReservationRow = {
  id: string;
  kind: TicketKind;
  quantity: number;
  adult_quantity: number;
  kids_quantity: number;
  status: string;
};

let schemaReady = false;

async function ensureSchema() {
  if (schemaReady) return;
  const db = getRuntimeEnv().DB;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS event_inventory (
      id TEXT PRIMARY KEY NOT NULL,
      capacity INTEGER NOT NULL,
      complimentary_capacity INTEGER NOT NULL,
      sold_paid INTEGER DEFAULT 0 NOT NULL,
      sold_complimentary INTEGER DEFAULT 0 NOT NULL,
      reserved_paid INTEGER DEFAULT 0 NOT NULL,
      reserved_complimentary INTEGER DEFAULT 0 NOT NULL,
      last_purchase_at TEXT
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY NOT NULL,
      kind TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      adult_quantity INTEGER DEFAULT 0 NOT NULL,
      kids_quantity INTEGER DEFAULT 0 NOT NULL,
      expires_at INTEGER NOT NULL,
      stripe_session_id TEXT UNIQUE,
      status TEXT DEFAULT 'active' NOT NULL,
      created_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY NOT NULL,
      stripe_session_id TEXT NOT NULL UNIQUE,
      payment_intent_id TEXT,
      buyer_name TEXT NOT NULL,
      buyer_email TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      adult_quantity INTEGER DEFAULT 0 NOT NULL,
      kids_quantity INTEGER DEFAULT 0 NOT NULL,
      kind TEXT NOT NULL,
      amount_total INTEGER NOT NULL,
      currency TEXT NOT NULL,
      email_status TEXT DEFAULT 'pending' NOT NULL,
      created_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      public_number TEXT UNIQUE,
      order_id TEXT NOT NULL,
      qr_token TEXT NOT NULL UNIQUE,
      admission_type TEXT DEFAULT 'adult' NOT NULL,
      checked_in_at TEXT,
      created_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS webhook_events (
      id TEXT PRIMARY KEY NOT NULL,
      event_type TEXT NOT NULL,
      processed_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS donation_acknowledgements (
      event_id TEXT PRIMARY KEY NOT NULL,
      stripe_session_id TEXT NOT NULL UNIQUE,
      buyer_name TEXT NOT NULL,
      buyer_email TEXT NOT NULL,
      amount_total INTEGER NOT NULL,
      currency TEXT NOT NULL,
      email_status TEXT DEFAULT 'pending' NOT NULL,
      created_at TEXT NOT NULL
    )`),
  ]);
  schemaReady = true;
}

export async function ensureInventory() {
  await ensureSchema();
  const db = getRuntimeEnv().DB;
  await db.prepare(
    `INSERT OR IGNORE INTO event_inventory
      (id, capacity, complimentary_capacity, sold_paid, sold_complimentary, reserved_paid, reserved_complimentary)
     VALUES (?, ?, ?, 0, 0, 0, 0)`,
  ).bind(EVENT_ID, CAPACITY, COMPLIMENTARY_CAPACITY).run();
}

export async function cleanupExpiredReservations() {
  const db = getRuntimeEnv().DB;
  const now = Math.floor(Date.now() / 1000);
  const expired = await db.prepare(
    "SELECT id, kind, quantity FROM reservations WHERE status = 'active' AND expires_at < ? LIMIT 100",
  ).bind(now).all<{ id: string; kind: TicketKind; quantity: number }>();
  for (const reservation of expired.results) {
    const reservedColumn = reservation.kind === "complimentary" ? "reserved_complimentary" : "reserved_paid";
    await db.batch([
      db.prepare("UPDATE reservations SET status = 'expired' WHERE id = ? AND status = 'active'").bind(reservation.id),
      db.prepare(`UPDATE event_inventory SET ${reservedColumn} = MAX(0, ${reservedColumn} - ?) WHERE id = ?`)
        .bind(reservation.quantity, EVENT_ID),
    ]);
  }
}

export async function getAvailability() {
  await ensureInventory();
  await cleanupExpiredReservations();
  const row = await getRuntimeEnv().DB.prepare(
    `SELECT capacity, complimentary_capacity, sold_paid, sold_complimentary,
            reserved_paid, reserved_complimentary, last_purchase_at
     FROM event_inventory WHERE id = ?`,
  ).bind(EVENT_ID).first<Record<string, number | string | null>>();
  if (!row) throw new Error("Ticket inventory is unavailable.");
  const allocated = Number(row.sold_paid) + Number(row.sold_complimentary);
  return {
    capacity: Number(row.capacity),
    complimentaryCapacity: Number(row.complimentary_capacity),
    paidSold: Number(row.sold_paid),
    complimentaryIssued: Number(row.sold_complimentary),
    totalIssued: allocated,
    remaining: Number(row.capacity) - allocated,
    paidAvailable: PAID_CAPACITY - Number(row.sold_paid) - Number(row.reserved_paid),
    complimentaryAvailable:
      Number(row.complimentary_capacity) -
      Number(row.sold_complimentary) -
      Number(row.reserved_complimentary),
    lastPurchaseAt: row.last_purchase_at ? String(row.last_purchase_at) : null,
  };
}

export async function createReservation(kind: TicketKind, adultQuantity: number, kidsQuantity: number) {
  await ensureInventory();
  await cleanupExpiredReservations();
  const quantity = adultQuantity + kidsQuantity;
  const db = getRuntimeEnv().DB;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const expiresAt = Math.floor(Date.now() / 1000) + 31 * 60;
  const soldColumn = kind === "complimentary" ? "sold_complimentary" : "sold_paid";
  const reservedColumn = kind === "complimentary" ? "reserved_complimentary" : "reserved_paid";
  const allocation = kind === "complimentary" ? COMPLIMENTARY_CAPACITY : PAID_CAPACITY;
  const update = await db.prepare(
    `UPDATE event_inventory
     SET ${reservedColumn} = ${reservedColumn} + ?
     WHERE id = ? AND ${soldColumn} + ${reservedColumn} + ? <= ?`,
  ).bind(quantity, EVENT_ID, quantity, allocation).run();
  if (!update.meta.changes) throw new Error(kind === "complimentary" ? "The complimentary allocation has been used." : "Not enough paid tickets remain.");
  try {
    await db.prepare(
      `INSERT INTO reservations (id, kind, quantity, adult_quantity, kids_quantity, expires_at, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
    ).bind(id, kind, quantity, adultQuantity, kidsQuantity, expiresAt, now).run();
  } catch (error) {
    await db.prepare(`UPDATE event_inventory SET ${reservedColumn} = MAX(0, ${reservedColumn} - ?) WHERE id = ?`)
      .bind(quantity, EVENT_ID).run();
    throw error;
  }
  return { id, expiresAt };
}

export async function attachStripeSession(reservationId: string, stripeSessionId: string) {
  await getRuntimeEnv().DB.prepare(
    "UPDATE reservations SET stripe_session_id = ? WHERE id = ? AND status = 'active'",
  ).bind(stripeSessionId, reservationId).run();
}

export async function releaseReservation(reservationId: string) {
  const db = getRuntimeEnv().DB;
  const row = await db.prepare(
    "SELECT id, kind, quantity, status FROM reservations WHERE id = ?",
  ).bind(reservationId).first<ReservationRow>();
  if (!row || row.status !== "active") return;
  const reservedColumn = row.kind === "complimentary" ? "reserved_complimentary" : "reserved_paid";
  await db.batch([
    db.prepare("UPDATE reservations SET status = 'cancelled' WHERE id = ? AND status = 'active'").bind(reservationId),
    db.prepare(`UPDATE event_inventory SET ${reservedColumn} = MAX(0, ${reservedColumn} - ?) WHERE id = ?`)
      .bind(row.quantity, EVENT_ID),
  ]);
}

export type IssuedTicket = { number: string; token: string; admissionType: AdmissionType; checkedInAt: string | null };
export type TicketOrder = {
  id: string;
  buyerName: string;
  buyerEmail: string;
  quantity: number;
  adultQuantity: number;
  kidsQuantity: number;
  kind: TicketKind;
  amountTotal: number;
  currency: string;
  emailStatus: string;
  createdAt: string;
  tickets: IssuedTicket[];
};

async function loadOrder(stripeSessionId: string): Promise<TicketOrder | null> {
  const db = getRuntimeEnv().DB;
  const order = await db.prepare(
    `SELECT id, buyer_name, buyer_email, quantity, adult_quantity, kids_quantity, kind, amount_total, currency, email_status, created_at
     FROM orders WHERE stripe_session_id = ?`,
  ).bind(stripeSessionId).first<Record<string, string | number>>();
  if (!order) return null;
  const rows = await db.prepare(
    "SELECT id, public_number, qr_token, admission_type, checked_in_at FROM tickets WHERE order_id = ? ORDER BY id",
  ).bind(String(order.id)).all<{ id: number; public_number: string | null; qr_token: string; admission_type: string; checked_in_at: string | null }>();
  for (const row of rows.results) {
    if (!row.public_number) {
      row.public_number = ticketNumber(row.id);
      await db.prepare("UPDATE tickets SET public_number = ? WHERE id = ?").bind(row.public_number, row.id).run();
    }
  }
  return {
    id: String(order.id),
    buyerName: String(order.buyer_name),
    buyerEmail: String(order.buyer_email),
    quantity: Number(order.quantity),
    adultQuantity: Number(order.adult_quantity),
    kidsQuantity: Number(order.kids_quantity),
    kind: String(order.kind) as TicketKind,
    amountTotal: Number(order.amount_total),
    currency: String(order.currency),
    emailStatus: String(order.email_status),
    createdAt: String(order.created_at),
    tickets: rows.results.map((row: { public_number: string | null; qr_token: string; admission_type: string; checked_in_at: string | null }) => ({
      number: row.public_number!,
      token: row.qr_token,
      admissionType: row.admission_type as AdmissionType,
      checkedInAt: row.checked_in_at,
    })),
  };
}

export async function fulfillCheckout(eventId: string, session: CheckoutSession) {
  const reservationId = session.metadata?.reservation_id;
  if (!reservationId) return null;
  const existing = await loadOrder(session.id);
  if (existing) return existing;

  const db = getRuntimeEnv().DB;
  const reservation = await db.prepare(
    "SELECT id, kind, quantity, adult_quantity, kids_quantity, status FROM reservations WHERE id = ?",
  ).bind(reservationId).first<ReservationRow>();
  if (!reservation || reservation.status !== "active") throw new Error("The ticket reservation is not active.");

  const buyerEmail = session.customer_details?.email?.trim();
  const buyerName = session.customer_details?.name?.trim();
  if (!buyerEmail || !buyerName) throw new Error("Stripe did not return the buyer name and email.");

  const orderId = crypto.randomUUID();
  const now = new Date().toISOString();
  const soldColumn = reservation.kind === "complimentary" ? "sold_complimentary" : "sold_paid";
  const reservedColumn = reservation.kind === "complimentary" ? "reserved_complimentary" : "reserved_paid";
  const admissionTypes: AdmissionType[] = [
    ...Array.from({ length: reservation.adult_quantity }, () => "adult" as const),
    ...Array.from({ length: reservation.kids_quantity }, () => "kids" as const),
  ];
  const ticketStatements = admissionTypes.map(admissionType =>
    db.prepare(
      `INSERT INTO tickets (public_number, order_id, qr_token, admission_type, checked_in_at, created_at)
       VALUES (NULL, ?, ?, ?, NULL, ?)`,
    ).bind(orderId, randomToken(24), admissionType, now),
  );
  const expectedAmount = reservation.kind === "complimentary" ? 0 :
    reservation.adult_quantity * ADULT_TICKET_PRICE_CENTS +
    reservation.kids_quantity * KIDS_TICKET_PRICE_CENTS +
    reservation.quantity * BOOKING_FEE_CENTS;
  if ((session.amount_total ?? expectedAmount) !== expectedAmount) {
    throw new Error("The ticket payment total did not match the reservation.");
  }
  try {
    await db.batch([
      db.prepare("INSERT INTO webhook_events (id, event_type, processed_at) VALUES (?, ?, ?)")
        .bind(eventId, "checkout.session.completed", now),
      db.prepare(
        `UPDATE event_inventory
         SET ${reservedColumn} = MAX(0, ${reservedColumn} - ?),
             ${soldColumn} = ${soldColumn} + ?,
             last_purchase_at = ?
         WHERE id = ?`,
      ).bind(reservation.quantity, reservation.quantity, now, EVENT_ID),
      db.prepare("UPDATE reservations SET status = 'completed' WHERE id = ? AND status = 'active'")
        .bind(reservationId),
      db.prepare(
        `INSERT INTO orders
          (id, stripe_session_id, payment_intent_id, buyer_name, buyer_email, quantity,
           adult_quantity, kids_quantity, kind, amount_total, currency, email_status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      ).bind(
        orderId,
        session.id,
        session.payment_intent ?? null,
        buyerName,
        buyerEmail,
        reservation.quantity,
        reservation.adult_quantity,
        reservation.kids_quantity,
        reservation.kind,
        session.amount_total ?? 0,
        session.currency ?? "nzd",
        now,
      ),
      ...ticketStatements,
    ]);
  } catch (error) {
    const recovered = await loadOrder(session.id);
    if (recovered) return recovered;
    throw error;
  }
  return loadOrder(session.id);
}

export async function markEmailStatus(orderId: string, status: "sent" | "failed") {
  await getRuntimeEnv().DB.prepare("UPDATE orders SET email_status = ? WHERE id = ?")
    .bind(status, orderId).run();
}

export type DonationAcknowledgement = {
  eventId: string;
  stripeSessionId: string;
  buyerName: string;
  buyerEmail: string;
  amountTotal: number;
  currency: string;
  emailStatus: string;
  createdAt: string;
};

export async function prepareDonationAcknowledgement(
  eventId: string,
  session: CheckoutSession,
): Promise<DonationAcknowledgement> {
  await ensureSchema();
  const buyerEmail = session.customer_details?.email?.trim();
  const buyerName = session.customer_details?.name?.trim() || "there";
  if (!buyerEmail) throw new Error("Stripe did not return the donor email.");
  const createdAt = new Date().toISOString();
  const db = getRuntimeEnv().DB;
  await db.prepare(
    `INSERT OR IGNORE INTO donation_acknowledgements
      (event_id, stripe_session_id, buyer_name, buyer_email, amount_total, currency, email_status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
  ).bind(
    eventId,
    session.id,
    buyerName,
    buyerEmail,
    session.amount_total ?? 0,
    session.currency ?? "nzd",
    createdAt,
  ).run();
  const row = await db.prepare(
    `SELECT event_id, stripe_session_id, buyer_name, buyer_email, amount_total, currency,
            email_status, created_at
     FROM donation_acknowledgements WHERE event_id = ?`,
  ).bind(eventId).first<Record<string, string | number>>();
  if (!row) throw new Error("Donation acknowledgement could not be prepared.");
  return {
    eventId: String(row.event_id),
    stripeSessionId: String(row.stripe_session_id),
    buyerName: String(row.buyer_name),
    buyerEmail: String(row.buyer_email),
    amountTotal: Number(row.amount_total),
    currency: String(row.currency),
    emailStatus: String(row.email_status),
    createdAt: String(row.created_at),
  };
}

export async function markDonationEmailStatus(
  eventId: string,
  status: "sent" | "failed",
) {
  await getRuntimeEnv().DB.prepare(
    "UPDATE donation_acknowledgements SET email_status = ? WHERE event_id = ?",
  ).bind(status, eventId).run();
}

export async function getOrderForCustomer(stripeSessionId: string) {
  return loadOrder(stripeSessionId);
}

export async function findTicket(tokenOrNumber: string) {
  return getRuntimeEnv().DB.prepare(
    `SELECT t.id, t.public_number, t.qr_token, t.admission_type, t.checked_in_at, o.buyer_name, o.kind
     FROM tickets t JOIN orders o ON o.id = t.order_id
     WHERE t.qr_token = ? OR UPPER(t.public_number) = UPPER(?)`,
  ).bind(tokenOrNumber, tokenOrNumber).first<Record<string, string | number | null>>();
}

export async function checkInTicket(tokenOrNumber: string) {
  const ticket = await findTicket(tokenOrNumber);
  if (!ticket) return { status: "invalid" as const };
  if (ticket.checked_in_at) return { status: "used" as const, ticket };
  const checkedInAt = new Date().toISOString();
  const result = await getRuntimeEnv().DB.prepare(
    "UPDATE tickets SET checked_in_at = ? WHERE id = ? AND checked_in_at IS NULL",
  ).bind(checkedInAt, ticket.id).run();
  if (!result.meta.changes) {
    const refreshed = await findTicket(tokenOrNumber);
    return { status: "used" as const, ticket: refreshed };
  }
  return { status: "valid" as const, ticket: { ...ticket, checked_in_at: checkedInAt } };
}
