import { clearSessionCookie } from "@/lib/admin-auth";

export async function POST() {
  return new Response(JSON.stringify({ authenticated: false }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": clearSessionCookie(),
    },
  });
}
