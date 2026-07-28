import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { getRuntimeEnv } from "@/db";
import {
  BOOKING_FEE_CENTS,
  EVENT_DATE,
  EVENT_NAME,
  EVENT_SUBTITLE,
  EVENT_TIME,
  EVENT_VENUE,
  TICKET_PRICE_CENTS,
} from "./event-config";
import { bytesToBase64 } from "./encoding";
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

function pdfSafeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\x20-\x7E]/g, "?");
}

function drawMaoriSubtitle(
  page: ReturnType<PDFDocument["addPage"]>,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
) {
  const x = 44;
  const y = 679;
  const size = 16;
  const color = rgb(0.47, 0.89, 0.3);
  const subtitle = "Te Hikoi o te Tumanako";
  page.drawText(subtitle, { x, y, size, font, color });
  for (const prefix of ["Te H", "Te Hikoi o te T"]) {
    const macronX = x + font.widthOfTextAtSize(prefix, size);
    const letterWidth = font.widthOfTextAtSize(prefix === "Te H" ? "i" : "u", size);
    page.drawLine({
      start: { x: macronX + 0.4, y: y + size + 1.5 },
      end: { x: macronX + Math.max(3.5, letterWidth - 0.4), y: y + size + 1.5 },
      thickness: 1.1,
      color,
    });
  }
}

async function createTicketPdf(order: TicketOrder, origin: string) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  for (const ticket of order.tickets) {
    const page = pdf.addPage([595, 842]);
    page.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: rgb(0.02, 0.02, 0.02) });
    page.drawRectangle({ x: 0, y: 772, width: 595, height: 70, color: rgb(0.98, 0.3, 0.08) });
    page.drawText("MOKSHA BASE PRESENTS", { x: 44, y: 802, size: 10, font: bold, color: rgb(1, 1, 1) });
    page.drawText(EVENT_NAME.toUpperCase(), { x: 44, y: 712, size: 34, font: bold, color: rgb(1, 0.72, 0) });
    drawMaoriSubtitle(page, regular);
    page.drawText("GENERAL ADMISSION", { x: 44, y: 626, size: 11, font: bold, color: rgb(0.75, 0.75, 0.72) });
    page.drawText(EVENT_DATE, { x: 44, y: 592, size: 17, font: bold, color: rgb(1, 1, 1) });
    page.drawText(EVENT_TIME, { x: 44, y: 565, size: 13, font: regular, color: rgb(0.82, 0.81, 0.78) });
    page.drawText(EVENT_VENUE, { x: 44, y: 538, size: 13, font: regular, color: rgb(0.82, 0.81, 0.78) });
    page.drawText(`Ticket ${ticket.number}`, { x: 44, y: 472, size: 22, font: bold, color: rgb(1, 1, 1) });
    page.drawText(`Issued to ${pdfSafeText(order.buyerName)}`, { x: 44, y: 445, size: 12, font: regular, color: rgb(0.68, 0.68, 0.65) });
    const qrDataUrl = await QRCode.toDataURL(`${origin}/check-in?token=${encodeURIComponent(ticket.token)}`, {
      width: 560,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#050505", light: "#ffffff" },
    });
    const qr = await pdf.embedPng(qrDataUrl);
    page.drawRectangle({ x: 174, y: 142, width: 247, height: 247, color: rgb(1, 1, 1) });
    page.drawImage(qr, { x: 184, y: 152, width: 227, height: 227 });
    page.drawText("Present this QR code at entry", { x: 190, y: 116, size: 11, font: regular, color: rgb(0.7, 0.7, 0.67) });
    page.drawText("Each code admits one person and can be used once.", { x: 164, y: 92, size: 9, font: regular, color: rgb(0.5, 0.5, 0.48) });
  }
  return pdf.save();
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
  const html = `
    <div style="margin:0;background:#090909;color:#f8f5ec;font-family:Arial,sans-serif;padding:32px 16px">
      <div style="max-width:640px;margin:auto;background:#111;border-top:5px solid #ffb600;padding:36px">
        <p style="color:#76e34d;letter-spacing:2px;font-size:11px;font-weight:700">MOKSHA BASE PRESENTS</p>
        <h1 style="font-size:36px;margin:12px 0 4px;color:#ffb600">${EVENT_NAME}</h1>
        <p style="margin:0 0 28px;color:#9fe981">${EVENT_SUBTITLE}</p>
        <p>Kia ora ${buyerName},</p>
        <p>Your ${isComplimentary ? "complimentary " : ""}booking is confirmed. Your QR-coded tickets are attached as a PDF.</p>
        <div style="background:#191919;padding:20px;margin:24px 0;border-left:3px solid #ff4b18">
          <strong>${EVENT_DATE}</strong><br>${EVENT_TIME}<br>${EVENT_VENUE}
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
      subject: `${EVENT_NAME} tickets — ${order.tickets.map(ticket => ticket.number).join(", ")}`,
      html,
      attachments: [{ filename: `rhythms-of-hope-${order.id}.pdf`, content: bytesToBase64(pdf) }],
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Ticket email failed: ${detail}`);
  }
}
