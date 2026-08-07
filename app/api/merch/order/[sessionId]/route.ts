import { fulfillMerchCheckout, getMerchOrderForCustomer, markMerchEmailStatus } from "@/lib/merch-store";
import { sendMerchOrderEmails } from "@/lib/merch-email";
import { retrieveStripeCheckout } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await context.params;
  if (!sessionId.startsWith("cs_")) return Response.json({ error: "Invalid order reference." }, { status: 400 });
  let order = await getMerchOrderForCustomer(sessionId);
  if (!order) {
    const session = await retrieveStripeCheckout(sessionId);
    if (session.payment_status !== "paid") return Response.json({ pending: true }, { status: 202 });
    order = await fulfillMerchCheckout(session);
  }
  if (!order) return Response.json({ pending: true }, { status: 202 });
  if (order.emailStatus !== "sent") {
    try { await sendMerchOrderEmails(order); await markMerchEmailStatus(order.id, "sent"); }
    catch (error) { await markMerchEmailStatus(order.id, "failed"); console.error(error); }
  }
  return Response.json({ pending: false, order: { id: order.id, amountTotal: order.amountTotal, status: order.status, items: order.items } });
}
