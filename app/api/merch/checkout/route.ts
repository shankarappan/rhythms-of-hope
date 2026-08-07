import { getRuntimeEnv } from "@/db";
import { parseMerchCart } from "@/lib/merch";
import { createMerchCheckout } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  if (getRuntimeEnv().MERCH_ENABLED !== "true") return Response.json({ error: "The preview shop is not enabled." }, { status: 503 });
  try {
    const payload = await request.json() as { items?: unknown };
    const items = parseMerchCart(payload.items);
    const session = await createMerchCheckout({ origin: new URL(request.url).origin, items });
    return Response.json({ checkoutUrl: session.url });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Checkout could not be started." }, { status: 400 });
  }
}
