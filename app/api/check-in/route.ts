import { isAdminRequest } from "@/lib/admin-auth";
import { checkInTicket, findTicket } from "@/lib/ticket-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ authenticated: false }, { status: 401 });
  }
  const payload = (await request.json().catch(() => null)) as {
    ticket?: string;
    confirm?: boolean;
  } | null;
  const ticket = payload?.ticket?.trim() ?? "";
  if (!ticket) return Response.json({ error: "Enter or scan a ticket." }, { status: 400 });
  if (!payload?.confirm) {
    const found = await findTicket(ticket);
    if (!found) return Response.json({ status: "invalid" });
    return Response.json({ status: found.checked_in_at ? "used" : "ready", ticket: found });
  }
  return Response.json(await checkInTicket(ticket));
}
