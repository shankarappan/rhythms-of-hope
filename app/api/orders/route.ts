import { isOrdersAdminRequest } from "@/lib/admin-auth";
import { listMerchOrders, updateMerchOrderStatus, type MerchOrderStatus } from "@/lib/merch-store";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!(await isOrdersAdminRequest(request))) return Response.json({ authenticated: false }, { status: 401 });
  return Response.json({ authenticated: true, orders: await listMerchOrders() });
}
export async function PATCH(request: Request) {
  if (!(await isOrdersAdminRequest(request))) return Response.json({ authenticated: false }, { status: 401 });
  const payload = await request.json().catch(() => ({})) as { id?: string; status?: MerchOrderStatus };
  if (!payload.id || !["new", "ready", "collected", "cancelled"].includes(payload.status ?? "")) {
    return Response.json({ error: "Invalid order update." }, { status: 400 });
  }
  if (!(await updateMerchOrderStatus(payload.id, payload.status!))) return Response.json({ error: "Order not found." }, { status: 404 });
  return Response.json({ updated: true });
}
