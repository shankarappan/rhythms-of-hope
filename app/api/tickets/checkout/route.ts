import { getRuntimeEnv } from "@/db";
import { MAX_PER_ORDER, type TicketKind } from "@/lib/event-config";
import { constantTimeEqual } from "@/lib/encoding";
import { createStripeCheckout } from "@/lib/stripe";
import {
  attachStripeSession,
  createReservation,
  releaseReservation,
} from "@/lib/ticket-store";

export const dynamic = "force-dynamic";

async function isComplimentaryCode(code: string) {
  const expected = getRuntimeEnv().COMPLIMENTARY_CODE_HASH;
  if (!expected || !code) return false;
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code.toUpperCase())),
  );
  const actual = [...digest].map(byte => byte.toString(16).padStart(2, "0")).join("");
  return constantTimeEqual(actual, expected);
}

export async function POST(request: Request) {
  if (getRuntimeEnv().TICKETING_ENABLED !== "true") {
    return Response.json({ error: "Ticket sales are not open yet." }, { status: 503 });
  }
  let payload: { quantity?: number; coupon?: string };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return Response.json({ error: "Invalid checkout request." }, { status: 400 });
  }
  const quantity = Number(payload.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_PER_ORDER) {
    return Response.json({ error: `Choose between 1 and ${MAX_PER_ORDER} tickets.` }, { status: 400 });
  }
  const coupon = payload.coupon?.trim().toUpperCase() ?? "";
  const complimentary = coupon ? await isComplimentaryCode(coupon) : false;
  if (coupon && !complimentary) {
    return Response.json({ error: "That complimentary code is not valid." }, { status: 400 });
  }
  const kind: TicketKind = complimentary ? "complimentary" : "paid";
  const reservation = await createReservation(kind, quantity).catch(error => {
    throw new Error(error instanceof Error ? error.message : "Tickets could not be reserved.");
  });
  try {
    const origin = new URL(request.url).origin;
    const session = await createStripeCheckout({
      origin,
      quantity,
      kind,
      reservationId: reservation.id,
    });
    await attachStripeSession(reservation.id, session.id);
    return Response.json({ checkoutUrl: session.url });
  } catch (error) {
    await releaseReservation(reservation.id);
    return Response.json(
      { error: error instanceof Error ? error.message : "Checkout could not be started." },
      { status: 502 },
    );
  }
}
