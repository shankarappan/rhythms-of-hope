import { getRuntimeEnv } from "@/db";
import {
  ADULT_TICKET_PRICE_CENTS,
  BOOKING_FEE_CENTS,
  EVENT_ADDRESS,
  EVENT_DATE,
  EVENT_NAME,
  EVENT_TIME,
  EVENT_VENUE,
  KIDS_TICKET_PRICE_CENTS,
  RESERVATION_SECONDS,
  type TicketKind,
} from "./event-config";
import { constantTimeEqual } from "./encoding";
import { encodeMerchCart, MERCH_PICKUP, MERCH_PRICE_CENTS, merchItemName, type MerchCartItem } from "./merch";

export type CheckoutSession = {
  id: string;
  url: string | null;
  payment_link?: string | null;
  amount_total?: number | null;
  currency?: string | null;
  payment_intent?: string | null;
  customer_details?: { email?: string | null; name?: string | null; phone?: string | null } | null;
  payment_status?: string | null;
  metadata?: Record<string, string>;
};

export async function createMerchCheckout(args: { origin: string; items: MerchCartItem[] }) {
  const runtime = getRuntimeEnv();
  if (!runtime.STRIPE_SECRET_KEY) throw new Error("Stripe checkout is not configured.");
  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("customer_creation", "always");
  body.set("name_collection[individual][enabled]", "true");
  body.set("phone_number_collection[enabled]", "true");
  body.set("metadata[order_type]", "merch");
  body.set("metadata[merch_cart]", encodeMerchCart(args.items));
  body.set("success_url", `${args.origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`);
  body.set("cancel_url", `${args.origin}/#shop`);
  args.items.forEach((item, index) => {
    body.set(`line_items[${index}][price_data][currency]`, "nzd");
    body.set(`line_items[${index}][price_data][unit_amount]`, String(MERCH_PRICE_CENTS));
    body.set(`line_items[${index}][price_data][product_data][name]`, merchItemName(item));
    body.set(`line_items[${index}][price_data][product_data][description]`, `Venue pickup · ${MERCH_PICKUP}`);
    body.set(`line_items[${index}][quantity]`, String(item.quantity));
  });
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${runtime.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": "2024-06-20",
      "Idempotency-Key": `roh-merch-${crypto.randomUUID()}`,
    },
    body,
  });
  const result = (await response.json()) as CheckoutSession & { error?: { message?: string } };
  if (!response.ok || !result.url) throw new Error(result.error?.message ?? "Stripe could not start checkout.");
  return result;
}

export async function retrieveStripeCheckout(sessionId: string) {
  const key = getRuntimeEnv().STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe checkout is not configured.");
  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${key}`, "Stripe-Version": "2024-06-20" },
  });
  const result = (await response.json()) as CheckoutSession & { error?: { message?: string } };
  if (!response.ok) throw new Error(result.error?.message ?? "The checkout could not be confirmed.");
  return result;
}

export async function createStripeCheckout(args: {
  origin: string;
  adultQuantity: number;
  kidsQuantity: number;
  kind: TicketKind;
  reservationId: string;
}) {
  const runtime = getRuntimeEnv();
  if (!runtime.STRIPE_SECRET_KEY) throw new Error("Stripe checkout is not configured.");
  if (args.kind === "complimentary" && !runtime.STRIPE_COMPLIMENTARY_COUPON_ID) {
    throw new Error("The complimentary ticket code is not configured.");
  }

  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("customer_creation", "always");
  body.set("name_collection[individual][enabled]", "true");
  let lineIndex = 0;
  const description = `${EVENT_DATE} · ${EVENT_TIME} · ${EVENT_VENUE}, ${EVENT_ADDRESS}`;
  const addLine = (name: string, amount: number, quantity: number, lineDescription = description) => {
    body.set(`line_items[${lineIndex}][price_data][currency]`, "nzd");
    body.set(`line_items[${lineIndex}][price_data][unit_amount]`, String(amount));
    body.set(`line_items[${lineIndex}][price_data][product_data][name]`, name);
    body.set(`line_items[${lineIndex}][price_data][product_data][description]`, lineDescription);
    body.set(`line_items[${lineIndex}][quantity]`, String(quantity));
    lineIndex += 1;
  };
  if (args.adultQuantity > 0) addLine(`${EVENT_NAME} — Adult Admission (16+)`, ADULT_TICKET_PRICE_CENTS, args.adultQuantity);
  if (args.kidsQuantity > 0) addLine(`${EVENT_NAME} — Kids Admission (15 and under)`, KIDS_TICKET_PRICE_CENTS, args.kidsQuantity);
  const totalQuantity = args.adultQuantity + args.kidsQuantity;
  addLine("Booking and processing fee", BOOKING_FEE_CENTS, totalQuantity, "NZ$2 per admission");
  body.set("metadata[reservation_id]", args.reservationId);
  body.set("metadata[ticket_kind]", args.kind);
  body.set("metadata[ticket_quantity]", String(totalQuantity));
  body.set("metadata[adult_quantity]", String(args.adultQuantity));
  body.set("metadata[kids_quantity]", String(args.kidsQuantity));
  body.set("expires_at", String(Math.floor(Date.now() / 1000) + RESERVATION_SECONDS));
  body.set("success_url", `${args.origin}/tickets/success?session_id={CHECKOUT_SESSION_ID}`);
  body.set("cancel_url", `${args.origin}/#tickets`);
  if (args.kind === "complimentary") {
    body.set("discounts[0][coupon]", runtime.STRIPE_COMPLIMENTARY_COUPON_ID!);
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${runtime.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": "2024-06-20",
      "Idempotency-Key": `roh-${args.reservationId}`,
    },
    body,
  });
  const result = (await response.json()) as CheckoutSession & { error?: { message?: string } };
  if (!response.ok || !result.url) {
    throw new Error(result.error?.message ?? "Stripe could not start checkout.");
  }
  return result;
}

function parseStripeSignature(header: string) {
  const values = new Map<string, string[]>();
  for (const part of header.split(",")) {
    const [key, value] = part.split("=", 2);
    if (!key || !value) continue;
    values.set(key, [...(values.get(key) ?? []), value]);
  }
  return { timestamp: values.get("t")?.[0], signatures: values.get("v1") ?? [] };
}

export async function verifyStripeWebhook(rawBody: string, signatureHeader: string) {
  const secret = getRuntimeEnv().STRIPE_WEBHOOK_SECRET;
  if (!secret) return false;
  const { timestamp, signatures } = parseStripeSignature(signatureHeader);
  if (!timestamp || signatures.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${rawBody}`)),
  );
  const expected = [...digest].map(byte => byte.toString(16).padStart(2, "0")).join("");
  return signatures.some(signature => constantTimeEqual(signature, expected));
}
