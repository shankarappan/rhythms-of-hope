import { getOrderForCustomer } from "@/lib/ticket-store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;
  if (!sessionId.startsWith("cs_")) return Response.json({ error: "Invalid order reference." }, { status: 400 });
  const order = await getOrderForCustomer(sessionId);
  if (!order) return Response.json({ pending: true }, { status: 202 });
  return Response.json({
    pending: false,
    order: {
      quantity: order.quantity,
      adultQuantity: order.adultQuantity,
      kidsQuantity: order.kidsQuantity,
      kind: order.kind,
      amountTotal: order.amountTotal,
      emailStatus: order.emailStatus,
      tickets: order.tickets.map(ticket => ({ number: ticket.number, admissionType: ticket.admissionType })),
    },
  });
}
