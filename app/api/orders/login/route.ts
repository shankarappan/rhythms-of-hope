import { createOrdersSessionCookie, verifyOrdersPassword } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({})) as { password?: string };
  if (!(await verifyOrdersPassword(payload.password ?? ""))) return Response.json({ authenticated: false }, { status: 401 });
  return new Response(JSON.stringify({ authenticated: true }), {
    headers: { "Content-Type": "application/json", "Set-Cookie": await createOrdersSessionCookie() },
  });
}
