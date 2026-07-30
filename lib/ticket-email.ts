import { getRuntimeEnv } from "@/db";
import {
  BOOKING_FEE_CENTS,
  EVENT_ADDRESS,
  EVENT_DATE,
  EVENT_NAME,
  EVENT_SUBTITLE,
  EVENT_TIME,
  EVENT_VENUE,
  TICKET_PRICE_CENTS,
} from "./event-config";
import { bytesToBase64 } from "./encoding";
import { createTicketPdf } from "./ticket-pdf";
import type { TicketOrder } from "./ticket-store";

function money(cents: number) {
  return new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD" }).format(cents / 100);
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    character =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[
        character
      ]!,
  );
}

export async function sendTicketEmail(order: TicketOrder, origin: string) {
  const apiKey = getRuntimeEnv().RESEND_API_KEY;
  if (!apiKey) throw new Error("Transactional email is not configured.");
  const pdf = await createTicketPdf(order, origin);
  const isComplimentary = order.kind === "complimentary";
  const rows = order.tickets
    .map(ticket => `<li style="margin:6px 0"><strong>${escapeHtml(ticket.number)}</strong></li>`)
    .join("");
  const buyerName = escapeHtml(order.buyerName);
  const orderId = escapeHtml(order.id);
  const hopeTitleUrl = escapeHtml(new URL("/hope-title.png", origin).toString());
  const html = `
    <div style="margin:0;background:#090909;color:#f8f5ec;font-family:Arial,sans-serif;padding:32px 16px">
      <div style="max-width:640px;margin:auto;background:#111;border-top:5px solid #ffb600;padding:36px">
        <p style="color:#76e34d;letter-spacing:2px;font-size:11px;font-weight:700">MOKSHA BASE PRESENTS</p>
        <img src="${hopeTitleUrl}" alt="HOPE" width="360" style="display:block;width:100%;max-width:360px;height:auto;margin:18px 0 12px">
        <p style="margin:0 0 5px;color:#ff6b2b;letter-spacing:2px;font-size:12px;font-weight:700">${EVENT_NAME.toUpperCase()}</p>
        <p style="margin:0 0 28px;color:#9fe981">${EVENT_SUBTITLE}</p>
        <p>Kia ora ${buyerName},</p>
        <p>Your ${isComplimentary ? "complimentary " : ""}booking is confirmed. Your QR-coded tickets are attached as a PDF.</p>
        <div style="background:#191919;padding:20px;margin:24px 0;border-left:3px solid #ff4b18">
          <strong>${EVENT_DATE}</strong><br>${EVENT_TIME}<br>${EVENT_VENUE}<br>${EVENT_ADDRESS}
        </div>
        <p><strong>Order reference:</strong> ${orderId}</p>
        <p><strong>Tickets:</strong> ${order.quantity}</p>
        <ul style="padding-left:20px">${rows}</ul>
        <table style="width:100%;border-collapse:collapse;margin:26px 0;color:#f8f5ec">
          <tr><td style="padding:8px 0;border-bottom:1px solid #333">General admission × ${order.quantity}</td><td style="text-align:right;border-bottom:1px solid #333">${isComplimentary ? money(0) : money(TICKET_PRICE_CENTS * order.quantity)}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #333">Booking and processing fee × ${order.quantity}</td><td style="text-align:right;border-bottom:1px solid #333">${isComplimentary ? money(0) : money(BOOKING_FEE_CENTS * order.quantity)}</td></tr>
          ${isComplimentary ? `<tr><td style="padding:8px 0;border-bottom:1px solid #333">Complimentary admission discount</td><td style="text-align:right;border-bottom:1px solid #333">-${money((TICKET_PRICE_CENTS + BOOKING_FEE_CENTS) * order.quantity)}</td></tr>` : ""}
          <tr><td style="padding:12px 0;font-weight:bold">Total paid</td><td style="text-align:right;font-weight:bold">${money(order.amountTotal)}</td></tr>
        </table>
        <p style="font-size:13px;color:#aaa">No GST has been charged. Please bring the attached ticket on your phone or printed. Each QR code admits one person and can be used once.</p>
        <p style="margin-top:28px">With hope,<br><strong>Moksha Base</strong></p>
      </div>
    </div>`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Moksha Base <info@mokshabase.com>",
      to: [order.buyerEmail],
      reply_to: "info@mokshabase.com",
      subject: "Hope Concert Tickets - Thanks for your ticket purchase",
      html,
      attachments: [{ filename: `rhythms-of-hope-${order.id}.pdf`, content: bytesToBase64(pdf) }],
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Ticket email failed: ${detail}`);
  }
}
