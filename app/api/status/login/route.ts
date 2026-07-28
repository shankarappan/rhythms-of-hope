import { createSessionCookie, verifyPassword } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as { password?: string } | null;
  if (!payload?.password || !(await verifyPassword(payload.password))) {
    return Response.json({ error: "Incorrect password." }, { status: 401 });
  }
  return new Response(JSON.stringify({ authenticated: true }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": await createSessionCookie(),
    },
  });
}
