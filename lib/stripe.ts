import { getRuntimeEnv } from "@/db";
import {
  BOOKING_FEE_CENTS,
  EVENT_DATE,
  EVENT_NAME,
  EVENT_TIME,
  EVENT_VENUE,
  RESERVATION_SECONDS,
  TICKET_PRICE_CENTS,
  type TicketKind,
} from "./event-config";
import { bytesToBase64Url, constantTimeEqual } from "./encoding";

export type CheckoutSession = {
  id: string;
  url: string | null;
  amount_total?: number | null;
  currency?: string | null;
  payment_intent?: string | null;
  customer_details?: { email?: string | null; name?: string | null } | null;
  metadata?: Record<string, string>;
};

export async function createStripeCheckout(args: {
  origin: string;
  quantity: number;
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
  body.set("line_items[0][price_data][currency]", "nzd");
  body.set("line_items[0][price_data][unit_amount]", String(TICKET_PRICE_CENTS));
  body.set("line_items[0][price_data][product_data][name]", `${EVENT_NAME} — General Admission`);
  body.set(
    "line_items[0][price_data][product_data][description]",
    `${EVENT_DATE} · ${EVENT_TIME} · ${EVENT_VENUE}`,
  );
  body.set("line_items[0][quantity]", String(args.quantity));
  body.set("line_items[1][price_data][currency]", "nzd");
  body.set("line_items[1][price_data][unit_amount]", String(BOOKING_FEE_CENTS));
  body.set("line_items[1][price_data][product_data][name]", "Booking and processing fee");
  body.set("line_items[1][quantity]", String(args.quantity));
  body.set("metadata[reservation_id]", args.reservationId);
  body.set("metadata[ticket_kind]", args.kind);
  body.set("metadata[ticket_quantity]", String(args.quantity));
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
