import { getRuntimeEnv } from "@/db";
import type { DonationAcknowledgement } from "./ticket-store";

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
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

export async function sendDonationAcknowledgement(
  acknowledgement: DonationAcknowledgement,
) {
  const apiKey = getRuntimeEnv().RESEND_API_KEY;
  if (!apiKey) throw new Error("Transactional email is not configured.");
  const buyerName = escapeHtml(acknowledgement.buyerName);
  const reference = escapeHtml(acknowledgement.stripeSessionId);
  const total = money(acknowledgement.amountTotal, acknowledgement.currency);
  const html = `
    <div style="margin:0;background:#090909;color:#f8f5ec;font-family:Arial,sans-serif;padding:32px 16px">
      <div style="max-width:640px;margin:auto;background:#111;border-top:5px solid #76e34d;padding:36px">
        <p style="color:#ffb600;letter-spacing:2px;font-size:11px;font-weight:700">MOKSHA BASE</p>
        <h1 style="font-size:34px;margin:12px 0 22px;color:#76e34d">Thank you for your support</h1>
        <p>Kia ora ${buyerName},</p>
        <p>We have received your donation to Moksha Base. Your support helps community-led music, storytelling, connection, and hopeful events such as Rhythms of Hope.</p>
        <div style="background:#191919;padding:20px;margin:24px 0;border-left:3px solid #ffb600">
          <p style="margin:0 0 8px;color:#aaa;font-size:12px">AMOUNT RECEIVED</p>
          <strong style="font-size:25px">${total}</strong>
        </div>
        <p style="font-size:13px;color:#aaa"><strong>Payment reference:</strong> ${reference}</p>
        <p style="font-size:13px;color:#aaa">No GST has been charged. Moksha Base makes no tax-deductibility claim for this acknowledgement.</p>
        <p style="margin-top:28px">With gratitude,<br><strong>Moksha Base</strong></p>
      </div>
    </div>`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Moksha Base <info@mokshabase.com>",
      to: [acknowledgement.buyerEmail],
      reply_to: "info@mokshabase.com",
      subject: "Thank you for your Moksha Base donation",
      html,
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Donation acknowledgement failed: ${detail}`);
  }
}
