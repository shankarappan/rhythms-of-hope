import { getRuntimeEnv } from "@/db";
import { decodeMerchCart, MERCH_PRICE_CENTS, type MerchCartItem } from "./merch";
import type { CheckoutSession } from "./stripe";

export type MerchOrderStatus = "new" | "ready" | "collected" | "cancelled";
export type MerchOrder = {
  id: string;
  stripeSessionId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  amountTotal: number;
  currency: string;
  status: MerchOrderStatus;
  emailStatus: string;
  createdAt: string;
  items: MerchCartItem[];
};

let merchSchemaReady = false;
async function ensureMerchSchema() {
  if (merchSchemaReady) return;
  const db = getRuntimeEnv().DB;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS merch_orders (
      id TEXT PRIMARY KEY NOT NULL,
      stripe_session_id TEXT NOT NULL UNIQUE,
      payment_intent_id TEXT,
      buyer_name TEXT NOT NULL,
      buyer_email TEXT NOT NULL,
      buyer_phone TEXT DEFAULT '' NOT NULL,
      amount_total INTEGER NOT NULL,
      currency TEXT NOT NULL,
      status TEXT DEFAULT 'new' NOT NULL,
      email_status TEXT DEFAULT 'pending' NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS merch_order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      order_id TEXT NOT NULL,
      audience TEXT NOT NULL,
      colour TEXT NOT NULL,
      size TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_amount INTEGER NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_merch_orders_status_created ON merch_orders(status, created_at)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_merch_items_order ON merch_order_items(order_id)"),
  ]);
  merchSchemaReady = true;
}

async function loadMerchOrderBySession(stripeSessionId: string): Promise<MerchOrder | null> {
  await ensureMerchSchema();
  const db = getRuntimeEnv().DB;
  const row = await db.prepare(`SELECT id, stripe_session_id, buyer_name, buyer_email, buyer_phone,
    amount_total, currency, status, email_status, created_at FROM merch_orders WHERE stripe_session_id = ?`)
    .bind(stripeSessionId).first<Record<string, string | number>>();
  if (!row) return null;
  const items = await db.prepare(`SELECT audience, colour, size, quantity FROM merch_order_items
    WHERE order_id = ? ORDER BY id`).bind(String(row.id)).all<MerchCartItem>();
  return {
    id: String(row.id), stripeSessionId: String(row.stripe_session_id), buyerName: String(row.buyer_name),
    buyerEmail: String(row.buyer_email), buyerPhone: String(row.buyer_phone), amountTotal: Number(row.amount_total),
    currency: String(row.currency), status: String(row.status) as MerchOrderStatus,
    emailStatus: String(row.email_status), createdAt: String(row.created_at), items: items.results,
  };
}

export async function fulfillMerchCheckout(session: CheckoutSession) {
  if (session.metadata?.order_type !== "merch") return null;
  const existing = await loadMerchOrderBySession(session.id);
  if (existing) return existing;
  const items = decodeMerchCart(session.metadata.merch_cart);
  const expected = items.reduce((sum, item) => sum + item.quantity * MERCH_PRICE_CENTS, 0);
  if (session.payment_status && session.payment_status !== "paid") throw new Error("The merchandise payment is not complete.");
  if ((session.amount_total ?? expected) !== expected) throw new Error("The merchandise payment total did not match the order.");
  const buyerEmail = session.customer_details?.email?.trim();
  const buyerName = session.customer_details?.name?.trim();
  if (!buyerEmail || !buyerName) throw new Error("Stripe did not return the customer name and email.");
  const orderId = crypto.randomUUID();
  const now = new Date().toISOString();
  const db = getRuntimeEnv().DB;
  try {
    await db.batch([
      db.prepare(`INSERT INTO merch_orders (id, stripe_session_id, payment_intent_id, buyer_name,
        buyer_email, buyer_phone, amount_total, currency, status, email_status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', 'pending', ?, ?)`).bind(
          orderId, session.id, session.payment_intent ?? null, buyerName, buyerEmail,
          session.customer_details?.phone?.trim() ?? "", session.amount_total ?? expected,
          session.currency ?? "nzd", now, now,
        ),
      ...items.map(item => db.prepare(`INSERT INTO merch_order_items
        (order_id, audience, colour, size, quantity, unit_amount) VALUES (?, ?, ?, ?, ?, ?)`)
        .bind(orderId, item.audience, item.colour, item.size, item.quantity, MERCH_PRICE_CENTS)),
    ]);
  } catch (error) {
    const recovered = await loadMerchOrderBySession(session.id);
    if (recovered) return recovered;
    throw error;
  }
  return loadMerchOrderBySession(session.id);
}

export async function getMerchOrderForCustomer(sessionId: string) { return loadMerchOrderBySession(sessionId); }

export async function listMerchOrders() {
  await ensureMerchSchema();
  const rows = await getRuntimeEnv().DB.prepare(`SELECT stripe_session_id FROM merch_orders
    ORDER BY CASE status WHEN 'new' THEN 0 WHEN 'ready' THEN 1 WHEN 'collected' THEN 2 ELSE 3 END, created_at DESC`)
    .all<{ stripe_session_id: string }>();
  return (await Promise.all(rows.results.map(row => loadMerchOrderBySession(row.stripe_session_id))))
    .filter((order): order is MerchOrder => Boolean(order));
}

export async function updateMerchOrderStatus(id: string, status: MerchOrderStatus) {
  await ensureMerchSchema();
  const result = await getRuntimeEnv().DB.prepare("UPDATE merch_orders SET status = ?, updated_at = ? WHERE id = ?")
    .bind(status, new Date().toISOString(), id).run();
  return Boolean(result.meta.changes);
}

export async function markMerchEmailStatus(id: string, status: "sent" | "failed") {
  await getRuntimeEnv().DB.prepare("UPDATE merch_orders SET email_status = ?, updated_at = ? WHERE id = ?")
    .bind(status, new Date().toISOString(), id).run();
}
