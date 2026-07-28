import { fulfillCheckout, markEmailStatus } from "@/lib/ticket-store";
import { sendTicketEmail } from "@/lib/ticket-email";
import { verifyStripeWebhook, type CheckoutSession } from "@/lib/stripe";

export const dynamic = "force-dynamic";

type StripeEvent = {
  id: string;
  type: string;
  data: { object: CheckoutSession };
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";
  if (!(await verifyStripeWebhook(rawBody, signature))) {
    return new Response("Invalid Stripe signature", { status: 400 });
  }
  const event = JSON.parse(rawBody) as StripeEvent;
  if (event.type !== "checkout.session.completed") return Response.json({ received: true });
  const order = await fulfillCheckout(event.id, event.data.object);
  if (!order) return Response.json({ received: true });
  if (order.emailStatus !== "sent") {
    try {
      await sendTicketEmail(order, new URL(request.url).origin);
      await markEmailStatus(order.id, "sent");
    } catch (error) {
      await markEmailStatus(order.id, "failed");
      console.error(error);
      return new Response("Ticket email delivery failed", { status: 500 });
    }
  }
  return Response.json({ received: true });
}
