import { getRuntimeEnv } from "@/db";
import { getAvailability } from "@/lib/ticket-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const availability = await getAvailability();
    return Response.json({
      ...availability,
      salesOpen: getRuntimeEnv().TICKETING_ENABLED === "true",
    });
  } catch (error) {
    console.error("Ticket availability failed", error);
    return Response.json({ error: "Ticket availability is temporarily unavailable." }, { status: 503 });
  }
}
