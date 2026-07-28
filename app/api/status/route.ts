import { isAdminRequest } from "@/lib/admin-auth";
import { getAvailability } from "@/lib/ticket-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ authenticated: false }, { status: 401 });
  }
  const availability = await getAvailability();
  return Response.json({ authenticated: true, availability });
}
