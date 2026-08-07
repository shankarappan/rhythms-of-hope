import {
  fulfillCheckout,
  markDonationEmailStatus,
  markEmailStatus,
  prepareDonationAcknowledgement,
} from "@/lib/ticket-store";
import { sendDonationAcknowledgement } from "@/lib/donation-email";
import { MOKSHA_DONATION_PAYMENT_LINK_ID } from "@/lib/event-config";
import { sendTicketEmail } from "@/lib/ticket-email";
import { verifyStripeWebhook, type CheckoutSession } from "@/lib/stripe";
import { fulfillMerchCheckout, markMerchEmailStatus } from "@/lib/merch-store";
import { sendMerchOrderEmails } from "@/lib/merch-email";

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
  const session = event.data.object;
  if (session.metadata?.order_type === "merch") {
    const merchOrder = await fulfillMerchCheckout(session);
    if (merchOrder && merchOrder.emailStatus !== "sent") {
      try {
        await sendMerchOrderEmails(merchOrder);
        await markMerchEmailStatus(merchOrder.id, "sent");
      } catch (error) {
        await markMerchEmailStatus(merchOrder.id, "failed");
        console.error(error);
        return new Response("Merchandise email delivery failed", { status: 500 });
      }
    }
    return Response.json({ received: true });
  }
  const order = await fulfillCheckout(event.id, session);
  if (order && order.emailStatus !== "sent") {
    try {
      await sendTicketEmail(order, new URL(request.url).origin);
      await markEmailStatus(order.id, "sent");
    } catch (error) {
      await markEmailStatus(order.id, "failed");
      console.error(error);
      return new Response("Ticket email delivery failed", { status: 500 });
    }
  }
  if (order) return Response.json({ received: true });
  if (session.payment_link === MOKSHA_DONATION_PAYMENT_LINK_ID) {
    const acknowledgement = await prepareDonationAcknowledgement(event.id, session);
    if (acknowledgement.emailStatus !== "sent") {
      try {
        await sendDonationAcknowledgement(acknowledgement);
        await markDonationEmailStatus(acknowledgement.eventId, "sent");
      } catch (error) {
        await markDonationEmailStatus(acknowledgement.eventId, "failed");
        console.error(error);
        return new Response("Donation acknowledgement delivery failed", { status: 500 });
      }
    }
  }
  return Response.json({ received: true });
}
