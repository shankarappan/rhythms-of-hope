import { getRuntimeEnv } from "@/db";
import { MERCH_PICKUP, merchItemName } from "./merch";
import type { MerchOrder } from "./merch-store";

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]!);
const money = (cents: number) => new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD" }).format(cents / 100);

export async function sendMerchOrderEmails(order: MerchOrder) {
  const apiKey = getRuntimeEnv().RESEND_API_KEY;
  if (!apiKey) throw new Error("Transactional email is not configured.");
  const rows = order.items.map(item => `<tr><td style="padding:9px 0;border-bottom:1px solid #333">${escapeHtml(merchItemName(item))}</td><td style="padding:9px 0;text-align:right;border-bottom:1px solid #333">${item.quantity}</td></tr>`).join("");
  const body = `
    <div style="margin:0;background:#080808;color:#f8f5ec;font-family:Arial,sans-serif;padding:32px 16px">
      <div style="max-width:640px;margin:auto;background:#111;border-top:5px solid #ff4b18;padding:36px">
        <p style="margin:0 0 8px;color:#ffb600;letter-spacing:2px;font-size:11px;font-weight:700">RHYTHMS OF HOPE</p>
        <h1 style="margin:0 0 24px;font-size:34px">Your HOPE T-shirt order is confirmed.</h1>
        <p>Kia ora ${escapeHtml(order.buyerName)},</p>
        <p>Thank you for wearing and sharing hope. Your order is paid and will be prepared for venue pickup.</p>
        <table style="width:100%;border-collapse:collapse;margin:24px 0;color:#f8f5ec">${rows}<tr><td style="padding:14px 0;font-weight:bold">Total paid</td><td style="text-align:right;font-weight:bold">${money(order.amountTotal)}</td></tr></table>
        <div style="background:#191919;padding:20px;margin:24px 0;border-left:3px solid #76e34d"><strong>Pickup at the event venue</strong><br>${escapeHtml(MERCH_PICKUP)}<br><small style="color:#aaa">We will email you when your order is ready to collect.</small></div>
        <p><strong>Order reference:</strong> ${escapeHtml(order.id)}</p>
        <p style="margin-top:28px">With hope,<br><strong>Moksha Base</strong></p>
      </div>
    </div>`;
  const adminRows = order.items.map(item => `${merchItemName(item)} × ${item.quantity}`).join("; ");
  const payloads = [
    { to: [order.buyerEmail], subject: "Your Rhythms of Hope T-shirt order", html: body },
    { to: ["info@mokshabase.com"], subject: `New merchandise order — ${order.buyerName}`, html: `${body}<div style="font-family:Arial;padding:20px"><h2>Order copy for Moksha Base</h2><p><strong>Customer:</strong> ${escapeHtml(order.buyerName)}<br><strong>Email:</strong> ${escapeHtml(order.buyerEmail)}<br><strong>Phone:</strong> ${escapeHtml(order.buyerPhone || "Not supplied")}<br><strong>Items:</strong> ${escapeHtml(adminRows)}</p></div>` },
  ];
  for (const payload of payloads) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Moksha Base <info@mokshabase.com>", reply_to: "info@mokshabase.com", ...payload }),
    });
    if (!response.ok) throw new Error(`Merchandise email failed: ${await response.text()}`);
  }
}
