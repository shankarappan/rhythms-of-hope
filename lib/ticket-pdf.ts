import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import cjfsLogoDataUrl from "./assets/cjfs-logo.png?inline";
import hopeTitleDataUrl from "./assets/hope-title.png?inline";
import {
  admissionLabel,
  EVENT_ADDRESS,
  EVENT_DATE,
  EVENT_NAME,
  EVENT_TIME,
  EVENT_VENUE,
} from "./event-config";
import type { TicketOrder } from "./ticket-store";

function pdfSafeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\x20-\x7E]/g, "?");
}

function drawMaoriSubtitle(
  page: ReturnType<PDFDocument["addPage"]>,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  y: number,
) {
  const subtitle = "Te Hikoi o te Tumanako";
  const size = 13;
  const x = 44;
  const color = rgb(0.47, 0.89, 0.3);
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

export async function createTicketPdf(order: TicketOrder, origin: string) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const cjfsLogo = await pdf.embedPng(cjfsLogoDataUrl);
  const hopeTitle = await pdf.embedPng(hopeTitleDataUrl);
  for (const ticket of order.tickets) {
    const page = pdf.addPage([595, 842]);
    page.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: rgb(0.02, 0.02, 0.02) });
    page.drawRectangle({ x: 0, y: 772, width: 595, height: 70, color: rgb(0.045, 0.045, 0.04) });
    page.drawRectangle({ x: 0, y: 772, width: 595, height: 2, color: rgb(1, 0.71, 0) });
    page.drawImage(cjfsLogo, { x: 44, y: 780, width: 41, height: 54 });
    page.drawText("CJFS PROUDLY PRESENTS", { x: 101, y: 811, size: 10, font: bold, color: rgb(1, 1, 1) });
    page.drawText("TAILORED SOLUTIONS | TRUSTED GUIDANCE", { x: 101, y: 794, size: 6.8, font: bold, color: rgb(0.93, 0.68, 0.17) });
    page.drawText("A MOKSHA BASE EVENT", { x: 437, y: 802, size: 7.5, font: bold, color: rgb(0.72, 0.72, 0.69) });
    page.drawImage(hopeTitle, { x: 44, y: 648, width: 360, height: 108.3 });
    page.drawText(EVENT_NAME.toUpperCase(), { x: 44, y: 620, size: 11, font: bold, color: rgb(1, 0.42, 0.08) });
    drawMaoriSubtitle(page, regular, 594);
    page.drawText(admissionLabel(ticket.admissionType).toUpperCase(), { x: 44, y: 548, size: 11, font: bold, color: ticket.admissionType === "kids" ? rgb(0.47, 0.89, 0.3) : rgb(0.75, 0.75, 0.72) });
    page.drawText(EVENT_DATE, { x: 44, y: 516, size: 17, font: bold, color: rgb(1, 1, 1) });
    page.drawText(EVENT_TIME, { x: 44, y: 489, size: 13, font: regular, color: rgb(0.82, 0.81, 0.78) });
    page.drawText(EVENT_VENUE, { x: 44, y: 462, size: 13, font: regular, color: rgb(0.82, 0.81, 0.78) });
    page.drawText(EVENT_ADDRESS, { x: 44, y: 440, size: 11, font: regular, color: rgb(0.68, 0.68, 0.65) });
    page.drawText(`Ticket ${ticket.number}`, { x: 44, y: 406, size: 22, font: bold, color: rgb(1, 1, 1) });
    page.drawText(`Issued to ${pdfSafeText(order.buyerName)}`, { x: 44, y: 379, size: 12, font: regular, color: rgb(0.68, 0.68, 0.65) });
    const qrDataUrl = await QRCode.toDataURL(`${origin}/check-in?token=${encodeURIComponent(ticket.token)}`, {
      width: 560,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#050505", light: "#ffffff" },
    });
    const qr = await pdf.embedPng(qrDataUrl);
    page.drawRectangle({ x: 174, y: 74, width: 247, height: 247, color: rgb(1, 1, 1) });
    page.drawImage(qr, { x: 184, y: 84, width: 227, height: 227 });
    page.drawText("Present this QR code at entry", { x: 190, y: 48, size: 11, font: regular, color: rgb(0.7, 0.7, 0.67) });
    page.drawText("Each code admits one person and can be used once.", { x: 164, y: 24, size: 9, font: regular, color: rgb(0.5, 0.5, 0.48) });
  }
  return pdf.save();
}
