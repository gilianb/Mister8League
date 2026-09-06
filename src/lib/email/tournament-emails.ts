import "server-only";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { isSmtpConfigured, smtpSendEmail } from "./smtp";
import { TOURNAMENT_CONTACT_EMAIL, tournamentAdminRecipient, tournamentSender } from "./senders";
import { adminNotificationTemplate, buyerConfirmationTemplate, type TournamentEmailContext } from "./templates/tournament";
import { formatDateLong, formatTime } from "@/lib/format";
import { formatEuros } from "@/lib/money";
import { registrationCode } from "@/lib/tournaments/codes";
import { getSiteUrl } from "@/lib/env";
import type { EventRow, LeaderRow, RegistrationRow } from "@/lib/db/types";

function paymentLabel(provider: string | null): string {
  switch (provider) {
    case "mollie":
      return "Payé en ligne (Mollie)";
    case "cash":
      return "Payé en boutique";
    case "free":
      return "Gratuit";
    default:
      return "Payé";
  }
}

/** Idempotence : une seule tentative « pending/sent » par (inscription, type, destinataire). */
async function createEmailEventOrSkip(opts: { registrationId: string; kind: string; recipient: string; force?: boolean }) {
  const admin = createAdminSupabase();
  if (!opts.force) {
    const { data: existing } = await admin
      .from("email_events")
      .select("id, status")
      .eq("registration_id", opts.registrationId)
      .eq("kind", opts.kind)
      .eq("recipient_email", opts.recipient)
      .in("status", ["sent", "pending"])
      .limit(1);
    if ((existing?.length ?? 0) > 0) return { skipped: true as const };
  }
  const { data, error } = await admin
    .from("email_events")
    .insert({ registration_id: opts.registrationId, kind: opts.kind, recipient_email: opts.recipient, status: "pending", provider: "smtp" })
    .select("id")
    .single<{ id: string }>();
  if (error || !data) throw new Error(`email_events insert : ${error?.message ?? "inconnu"}`);
  return { skipped: false as const, eventId: data.id };
}

async function markEmailEvent(eventId: string, status: "sent" | "failed", providerRef?: string | null, error?: string | null) {
  const admin = createAdminSupabase();
  await admin
    .from("email_events")
    .update({ status, provider_ref: providerRef ?? null, error: error ?? null, sent_at: status === "sent" ? new Date().toISOString() : null })
    .eq("id", eventId);
}

export function buildEmailContext(reg: RegistrationRow, event: EventRow, leader: LeaderRow | null): TournamentEmailContext {
  const site = getSiteUrl();
  const arrival = new Date(new Date(event.starts_at).getTime() - 30 * 60_000).toISOString();
  return {
    registrationCode: registrationCode(reg.id),
    eventTitle: event.title,
    eventDateLabel: formatDateLong(event.starts_at),
    eventStartTimeLabel: formatTime(event.starts_at),
    eventArrivalTimeLabel: formatTime(arrival),
    venueText: [event.venue_name, event.venue_address, event.city].filter(Boolean).join(" — "),
    participantName: reg.participant_name,
    participantEmail: reg.participant_email,
    paymentLabel: paymentLabel(reg.payment_provider),
    amountLabel: formatEuros(reg.amount_cents ?? 0, reg.currency ?? "EUR"),
    leaderName: leader?.name ?? null,
    eventUrl: `${site}/tournois/${event.slug}`,
    accountUrl: `${site}/joueur/inscriptions`,
    contactEmail: TOURNAMENT_CONTACT_EMAIL,
  };
}

/**
 * Envoie l'e-mail joueur (billet joint) et la notification admin.
 * Ne lève jamais pour un échec d'envoi : le statut est journalisé dans email_events.
 */
export async function sendRegistrationEmails(opts: {
  registration: RegistrationRow;
  event: EventRow;
  leader: LeaderRow | null;
  pdfBuffer: Buffer | null;
  force?: boolean;
}): Promise<{ buyer: "sent" | "skipped" | "failed" | "unconfigured"; admin: "sent" | "skipped" | "failed" | "unconfigured" }> {
  if (!isSmtpConfigured()) return { buyer: "unconfigured", admin: "unconfigured" };

  const { registration: reg, event, leader } = opts;
  const ctx = buildEmailContext(reg, event, leader);
  const { from, replyTo } = tournamentSender();
  const result = { buyer: "skipped" as "sent" | "skipped" | "failed" | "unconfigured", admin: "skipped" as "sent" | "skipped" | "failed" | "unconfigured" };

  const buyerEmail = (reg.participant_email || "").trim();
  if (buyerEmail) {
    const ev = await createEmailEventOrSkip({ registrationId: reg.id, kind: "buyer_registration_confirmation", recipient: buyerEmail, force: opts.force });
    if (!ev.skipped) {
      try {
        const tpl = buyerConfirmationTemplate(ctx);
        const sent = await smtpSendEmail({
          from,
          to: buyerEmail,
          subject: tpl.subject,
          text: tpl.text,
          html: tpl.html,
          replyTo,
          attachments: opts.pdfBuffer
            ? [{ filename: `Mister8_Billet_${ctx.registrationCode}.pdf`, content: opts.pdfBuffer, contentType: "application/pdf" }]
            : undefined,
        });
        await markEmailEvent(ev.eventId, "sent", sent.messageId);
        result.buyer = "sent";
      } catch (err) {
        await markEmailEvent(ev.eventId, "failed", null, err instanceof Error ? err.message : "Échec d'envoi");
        result.buyer = "failed";
      }
    }
  }

  const adminTo = tournamentAdminRecipient();
  const ev = await createEmailEventOrSkip({ registrationId: reg.id, kind: "admin_registration_notification", recipient: adminTo });
  if (!ev.skipped) {
    try {
      const tpl = adminNotificationTemplate(ctx);
      const sent = await smtpSendEmail({ from, to: adminTo, subject: tpl.subject, text: tpl.text, html: tpl.html, replyTo });
      await markEmailEvent(ev.eventId, "sent", sent.messageId);
      result.admin = "sent";
    } catch (err) {
      await markEmailEvent(ev.eventId, "failed", null, err instanceof Error ? err.message : "Échec d'envoi");
      result.admin = "failed";
    }
  }

  return result;
}
