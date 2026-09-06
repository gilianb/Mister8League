import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { formatDateLong, formatTime } from "@/lib/format";
import { registrationCode } from "./codes";

type EventForPdf = {
  id: string;
  slug: string;
  title: string;
  city: string;
  venue_name: string | null;
  venue_address: string | null;
  starts_at: string;
  format_label?: string | null;
};

type RegistrationForPdf = {
  id: string;
  participant_name: string;
  participant_email: string;
  participant_phone: string | null;
  leaderName?: string | null;
};

/** pdf-lib (polices standard) ne connaît que Latin-1 : on neutralise le reste. */
function safeText(s: string | null | undefined): string {
  return (s ?? "")
    .normalize("NFC")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .replace(/[–—]/g, "-")
    .replace(/ | /g, " ")
    .replace(/[^\x20-\x7E -ÿ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function shortenUrl(v: string, max = 70) {
  const s = v.trim();
  if (s.length <= max) return s;
  return `${s.slice(0, Math.max(0, max - 10))}...${s.slice(-9)}`;
}

export async function buildTicketPdf(opts: {
  event: EventForPdf;
  registration: RegistrationForPdf;
  /** URL http(s) encodée dans le QR, ex. https://…/billet/<token> */
  ticketUrl: string;
  contactLabel: string;
}): Promise<Buffer> {
  const { event, registration, ticketUrl } = opts;
  if (!/^https?:\/\//i.test(ticketUrl)) throw new Error("buildTicketPdf : ticketUrl doit être une URL http(s)");

  const doc = await PDFDocument.create();
  doc.setTitle(`Billet ${registrationCode(registration.id)} - ${safeText(event.title)}`);
  const page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const W = 595.28;
  const H = 841.89;
  const margin = 44;

  const coal = rgb(0.13, 0.12, 0.11);
  const gold = rgb(0.96, 0.76, 0.42);
  const text = rgb(0.16, 0.16, 0.16);
  const muted = rgb(0.42, 0.4, 0.36);
  const border = rgb(0.85, 0.82, 0.76);
  const panel = rgb(0.98, 0.96, 0.92);
  const brand = rgb(0.79, 0.2, 0.12);

  // Bandeau
  page.drawRectangle({ x: 0, y: H - 118, width: W, height: 118, color: coal });
  page.drawText("MISTER 8", { x: margin, y: H - 58, size: 24, font: bold, color: rgb(0.97, 0.94, 0.87) });
  page.drawText("TOURNAMENT LEAGUE", { x: margin, y: H - 76, size: 9, font: bold, color: gold });
  page.drawText("Billet de tournoi", { x: margin, y: H - 100, size: 13, font, color: rgb(0.85, 0.82, 0.75) });

  const code = registrationCode(registration.id);
  page.drawText("N° D'INSCRIPTION", { x: W - margin - 150, y: H - 58, size: 8, font: bold, color: gold });
  page.drawText(code, { x: W - margin - 150, y: H - 78, size: 18, font: bold, color: rgb(1, 1, 1) });

  // Carte événement
  let y = H - 150;
  const cardX = margin;
  const cardW = W - margin * 2;
  const cardH = 196;
  page.drawRectangle({ x: cardX, y: y - cardH, width: cardW, height: cardH, color: panel, borderColor: border, borderWidth: 1 });
  page.drawRectangle({ x: cardX, y: y - cardH, width: 6, height: cardH, color: brand });

  page.drawText(safeText(event.title), { x: cardX + 20, y: y - 34, size: 17, font: bold, color: text, maxWidth: cardW - 40 });
  const dateLine = `${formatDateLong(event.starts_at)} - ${formatTime(event.starts_at)}`;
  page.drawText(safeText(dateLine), { x: cardX + 20, y: y - 60, size: 11, font, color: text });
  const venue = [event.venue_name, event.venue_address, event.city].map(safeText).filter(Boolean).join(" - ");
  page.drawText(`Lieu : ${venue}`, { x: cardX + 20, y: y - 80, size: 11, font, color: text, maxWidth: cardW - 40 });
  if (event.format_label) {
    page.drawText(`Format : ${safeText(event.format_label)}`, { x: cardX + 20, y: y - 98, size: 10, font, color: muted });
  }

  page.drawText("PARTICIPANT", { x: cardX + 20, y: y - 128, size: 8, font: bold, color: muted });
  page.drawText(safeText(registration.participant_name), { x: cardX + 20, y: y - 146, size: 12, font: bold, color: text });
  page.drawText(safeText(registration.participant_email), { x: cardX + 20, y: y - 162, size: 10, font, color: muted });
  const extra = [registration.participant_phone, registration.leaderName ? `Leader déclaré : ${registration.leaderName}` : null]
    .map(safeText)
    .filter(Boolean)
    .join("  ·  ");
  if (extra) page.drawText(extra, { x: cardX + 20, y: y - 178, size: 10, font, color: muted });

  y -= cardH + 18;

  // Zone QR
  const qrBoxH = 220;
  page.drawRectangle({ x: cardX, y: y - qrBoxH, width: cardW, height: qrBoxH, color: rgb(1, 1, 1), borderColor: border, borderWidth: 1 });
  const leftW = cardW - 200;
  page.drawText("Check-in", { x: cardX + 20, y: y - 32, size: 14, font: bold, color: text });
  page.drawText("Présentez ce billet à l'accueil (téléphone ou papier).\nL'équipe scanne le QR code pour confirmer votre présence.", {
    x: cardX + 20,
    y: y - 56,
    size: 10.5,
    font,
    color: text,
    lineHeight: 14,
    maxWidth: leftW - 30,
  });
  page.drawText("À savoir", { x: cardX + 20, y: y - 112, size: 11, font: bold, color: text });
  const arrival = new Date(new Date(event.starts_at).getTime() - 30 * 60_000).toISOString();
  page.drawText(
    safeText(
      `- Le tournoi commence à ${formatTime(event.starts_at)}.\n- Arrivez avant ${formatTime(arrival)} pour l'enregistrement Bandai TCG+.\n- Votre decklist doit être saisie dans l'app Bandai TCG+ avant le tournoi.`
    ),
    { x: cardX + 20, y: y - 132, size: 10, font, color: muted, lineHeight: 14, maxWidth: leftW - 30 }
  );

  const qrDataUrl = await QRCode.toDataURL(ticketUrl, { margin: 1, scale: 7, errorCorrectionLevel: "M" });
  const qrBytes = Buffer.from(qrDataUrl.split(",")[1]!, "base64");
  const qrImage = await doc.embedPng(qrBytes);
  const qrSize = 150;
  const qrX = cardX + cardW - 20 - qrSize;
  const qrY = y - 40 - qrSize;
  page.drawRectangle({ x: qrX - 10, y: qrY - 10, width: qrSize + 20, height: qrSize + 52, color: panel, borderColor: border, borderWidth: 1 });
  page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });
  page.drawText("SCANNER POUR LE CHECK-IN", { x: qrX, y: qrY - 22, size: 8, font: bold, color: muted });
  page.drawText(shortenUrl(ticketUrl, 60), { x: qrX, y: qrY - 36, size: 6.5, font, color: muted, maxWidth: qrSize });

  y -= qrBoxH + 18;
  page.drawLine({ start: { x: margin, y }, end: { x: W - margin, y }, thickness: 1, color: border });
  y -= 18;
  page.drawText(`Une question ? ${safeText(opts.contactLabel)}`, { x: margin, y, size: 9.5, font, color: muted });
  page.drawText(`Code billet : ${code}`, { x: W - margin - 150, y, size: 9.5, font, color: muted });

  return Buffer.from(await doc.save());
}
