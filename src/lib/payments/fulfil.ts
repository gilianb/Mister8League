import "server-only";
import { createAdminSupabase } from "@/lib/supabase/admin";
import type { EventRow, LeaderRow, RegistrationRow } from "@/lib/db/types";
import { billingFromStored } from "./billing";
import { centsToMollieValue } from "./amounts";
import { mollieCreateSalesInvoice } from "./mollie-invoices";
import { generateTicketToken, hashTicketToken } from "@/lib/tournaments/ticket-token";
import { buildTicketPdf } from "@/lib/tournaments/pdf";
import { sendRegistrationEmails } from "@/lib/email/tournament-emails";
import { TOURNAMENT_CONTACT_LABEL } from "@/lib/email/senders";
import { getSiteUrl } from "@/lib/env";

const TICKET_BUCKET = "tournament-tickets";
const VAT_RATE = "20.00";

export type FulfilResult = {
  ticketPath: string | null;
  invoiceId: string | null;
  emails: Awaited<ReturnType<typeof sendRegistrationEmails>> | null;
  warnings: string[];
};

export function ticketStoragePath(eventId: string, registrationId: string) {
  return `event_${eventId}/registration_${registrationId}.pdf`;
}

/** Passe une inscription en « paid » (idempotent) et journalise. */
export async function markRegistrationPaid(
  registrationId: string,
  opts: { provider?: "mollie" | "cash" | "free"; paymentStatus?: string | null; eventType?: string; payload?: unknown } = {}
): Promise<void> {
  const admin = createAdminSupabase();
  const patch: Record<string, unknown> = {
    status: "paid",
    expires_at: null,
    paid_at: new Date().toISOString(),
  };
  if (opts.provider) patch.payment_provider = opts.provider;
  if (opts.paymentStatus !== undefined) patch.mollie_payment_status = opts.paymentStatus;
  await admin.from("registrations").update(patch).eq("id", registrationId).in("status", ["pending_payment", "cancelled"]);
  if (opts.eventType) {
    await admin.from("payment_events").insert({
      registration_id: registrationId,
      provider: opts.provider ?? "mollie",
      event_type: opts.eventType,
      provider_ref: null,
      payload: (opts.payload as Record<string, unknown> | undefined) ?? null,
    });
  }
}

async function loadRegistration(registrationId: string) {
  const admin = createAdminSupabase();
  const { data: reg } = await admin.from("registrations").select("*").eq("id", registrationId).maybeSingle<RegistrationRow>();
  if (!reg) throw new Error("Inscription introuvable");
  const { data: event } = await admin.from("events").select("*").eq("id", reg.event_id).maybeSingle<EventRow>();
  if (!event) throw new Error("Tournoi introuvable");
  let leader: LeaderRow | null = null;
  if (reg.leader_id) {
    const { data } = await admin.from("leaders").select("*").eq("id", reg.leader_id).maybeSingle<LeaderRow>();
    leader = data ?? null;
  }
  return { reg, event, leader };
}

async function ensureInvoice(reg: RegistrationRow, event: EventRow, warnings: string[]): Promise<string | null> {
  if (reg.mollie_sales_invoice_id) return reg.mollie_sales_invoice_id;
  if (!process.env.MOLLIE_API_KEY) return null;
  const recipient = billingFromStored(reg.billing_data);
  if (!recipient) {
    warnings.push("Adresse de facturation absente : pas de facture Mollie.");
    return null;
  }
  const amount = reg.amount_cents ?? 0;
  if (amount <= 0) return null;

  const admin = createAdminSupabase();
  // Verrou simple : une seule création concurrente.
  const { data: locked } = await admin
    .from("registrations")
    .update({ mollie_sales_invoice_status: "creating" })
    .eq("id", reg.id)
    .is("mollie_sales_invoice_id", null)
    .is("mollie_sales_invoice_status", null)
    .select("id");
  if (!locked || locked.length === 0) return null;

  try {
    const invoice = await mollieCreateSalesInvoice({
      status: "draft",
      recipientIdentifier: reg.profile_id ? `supabase:${reg.profile_id}` : `registration:${reg.id}`,
      recipient,
      vatScheme: "standard",
      vatMode: "inclusive",
      lines: [
        {
          description: `Billet tournoi — ${event.title}`.slice(0, 255),
          quantity: 1,
          unitPrice: { currency: (reg.currency ?? "EUR").toUpperCase(), value: centsToMollieValue(amount) },
          vatRate: VAT_RATE,
        },
      ],
      memo: reg.mollie_payment_id ? `Paiement confirmé via Mollie (${reg.mollie_payment_id}).` : `Paiement ${reg.payment_provider ?? ""} — inscription ${reg.id}.`,
      metadata: { purpose: "tournament_ticket", registrationId: reg.id, eventId: event.id, paymentId: reg.mollie_payment_id, vatRate: VAT_RATE, vatMode: "inclusive" },
    });
    await admin
      .from("registrations")
      .update({
        mollie_sales_invoice_id: invoice.id,
        mollie_sales_invoice_status: invoice.status ?? "draft",
        mollie_sales_invoice_number: invoice.invoiceNumber ?? null,
        mollie_sales_invoice_pdf_url: invoice._links?.pdf?.href ?? null,
        mollie_sales_invoice_created_at: new Date().toISOString(),
      })
      .eq("id", reg.id);
    await admin.from("payment_events").insert({
      registration_id: reg.id,
      provider: "mollie",
      event_type: "sales_invoice_created",
      provider_ref: invoice.id,
      payload: invoice,
    });
    return invoice.id;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Échec de création de la facture";
    warnings.push(`Facture Mollie : ${msg}`);
    await admin.from("registrations").update({ mollie_sales_invoice_status: null }).eq("id", reg.id).is("mollie_sales_invoice_id", null);
    await admin.from("payment_events").insert({ registration_id: reg.id, provider: "mollie", event_type: "sales_invoice_failed", provider_ref: null, payload: { error: msg } });
    return null;
  }
}

async function ensureTicket(reg: RegistrationRow, event: EventRow, leader: LeaderRow | null, baseUrl: string, warnings: string[]): Promise<{ path: string | null; pdf: Buffer | null }> {
  const admin = createAdminSupabase();
  const path = ticketStoragePath(event.id, reg.id);

  if (reg.ticket_pdf_path) {
    const { data, error } = await admin.storage.from(TICKET_BUCKET).download(reg.ticket_pdf_path);
    if (error || !data) {
      warnings.push("Billet existant introuvable dans le stockage, régénération.");
    } else {
      return { path: reg.ticket_pdf_path, pdf: Buffer.from(await data.arrayBuffer()) };
    }
  }

  const token = generateTicketToken();
  const { error: tokenErr } = await admin.from("ticket_tokens").upsert(
    { registration_id: reg.id, token_hash: hashTicketToken(token), expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString() },
    { onConflict: "registration_id" }
  );
  if (tokenErr) throw new Error(`Jeton de billet : ${tokenErr.message}`);

  const pdf = await buildTicketPdf({
    event,
    registration: {
      id: reg.id,
      participant_name: reg.participant_name,
      participant_email: reg.participant_email,
      participant_phone: reg.participant_phone,
      leaderName: leader?.name ?? null,
    },
    ticketUrl: `${baseUrl}/billet/${encodeURIComponent(token)}`,
    contactLabel: TOURNAMENT_CONTACT_LABEL,
  });

  const up = await admin.storage.from(TICKET_BUCKET).upload(path, pdf, { contentType: "application/pdf", upsert: true });
  if (up.error) {
    warnings.push(`Stockage du billet : ${up.error.message}`);
    return { path: null, pdf };
  }
  await admin.from("registrations").update({ ticket_pdf_path: path }).eq("id", reg.id);
  return { path, pdf };
}

/**
 * Après paiement : facture Mollie, billet PDF (QR), e-mails. Idempotent,
 * partagé par le webhook, la page de retour, l'inscription cash et les gratuits.
 */
export async function fulfilRegistration(registrationId: string, baseUrl = getSiteUrl()): Promise<FulfilResult> {
  const warnings: string[] = [];
  const { reg, event, leader } = await loadRegistration(registrationId);
  if (reg.status !== "paid" && reg.status !== "checked_in") {
    return { ticketPath: null, invoiceId: null, emails: null, warnings: [`Inscription non payée (${reg.status}).`] };
  }

  const invoiceId = reg.payment_provider === "free" ? null : await ensureInvoice(reg, event, warnings);
  const ticket = await ensureTicket(reg, event, leader, baseUrl, warnings);
  const emails = await sendRegistrationEmails({ registration: reg, event, leader, pdfBuffer: ticket.pdf });
  if (emails.buyer === "failed") warnings.push("L'e-mail joueur n'a pas pu être envoyé.");
  if (emails.buyer === "unconfigured") warnings.push("SMTP non configuré : aucun e-mail envoyé.");

  return { ticketPath: ticket.path, invoiceId, emails, warnings };
}

/** Renvoie le billet par e-mail (admin), en régénérant le PDF si besoin. */
export async function resendTicketEmail(registrationId: string, baseUrl = getSiteUrl()): Promise<string[]> {
  const warnings: string[] = [];
  const { reg, event, leader } = await loadRegistration(registrationId);
  if (reg.status !== "paid" && reg.status !== "checked_in") return ["Inscription non payée."];
  const ticket = await ensureTicket(reg, event, leader, baseUrl, warnings);
  const emails = await sendRegistrationEmails({ registration: reg, event, leader, pdfBuffer: ticket.pdf, force: true });
  if (emails.buyer !== "sent") warnings.push(`E-mail joueur : ${emails.buyer}`);
  return warnings;
}
