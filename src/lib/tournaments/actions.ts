"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { getSessionWithProfile, isProfileComplete } from "@/lib/auth/session";
import { validateEmail, validateFullName } from "@/lib/auth/validation";
import type { ActionState } from "@/lib/auth/actions";
import type { EventRow, RegistrationRow } from "@/lib/db/types";
import { getSiteUrl } from "@/lib/env";
import { computeTotals, centsToMollieValue, safeCurrency } from "@/lib/payments/amounts";
import { sanitizeBilling } from "@/lib/payments/billing";
import { fulfilRegistration, markRegistrationPaid } from "@/lib/payments/fulfil";
import { humanizeMollieError, isMollieResumable, mollieCancelPayment, mollieCheckoutUrl, mollieCreatePayment, mollieGetPayment } from "@/lib/payments/mollie";
import { resolveMollieWebhookUrl } from "@/lib/payments/webhook-url";
import { humanizeReserveError } from "./codes";
import { keepValues } from "@/lib/forms";
import { isActiveRegistration } from "./status";

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function paymentDescription(event: EventRow) {
  return `Mister 8 Tournament League — ${event.title}`.slice(0, 255);
}

async function createMolliePaymentFor(reg: RegistrationRow, event: EventRow, totalCents: number, currency: string) {
  const base = getSiteUrl();
  const mp = await mollieCreatePayment({
    amountValue: centsToMollieValue(totalCents),
    currency,
    description: paymentDescription(event),
    redirectUrl: `${base}/tournois/paiement/retour?inscription=${encodeURIComponent(reg.id)}`,
    webhookUrl: resolveMollieWebhookUrl(base, process.env.MOLLIE_WEBHOOK_URL),
    metadata: { registrationId: reg.id, eventId: event.id, profileId: reg.profile_id },
  });
  const admin = createAdminSupabase();
  await admin
    .from("registrations")
    .update({
      payment_provider: "mollie",
      mollie_payment_id: mp.id,
      mollie_payment_status: mp.status,
      amount_cents: totalCents,
      currency,
    })
    .eq("id", reg.id);
  await admin.from("payment_events").insert({
    registration_id: reg.id,
    provider: "mollie",
    event_type: "create_payment",
    provider_ref: mp.id,
    payload: { molliePaymentId: mp.id, totalCents, currency },
  });
  return mp;
}

async function cancelRegistration(regId: string, molliePaymentId?: string | null, eventType = "cancel") {
  const admin = createAdminSupabase();
  await admin.from("registrations").update({ status: "cancelled", expires_at: null }).eq("id", regId).eq("status", "pending_payment");
  if (molliePaymentId) await mollieCancelPayment(molliePaymentId);
  await admin.from("payment_events").insert({
    registration_id: regId,
    provider: molliePaymentId ? "mollie" : "internal",
    event_type: eventType,
    provider_ref: molliePaymentId ?? null,
    payload: { registrationId: regId },
  });
}

/** Réserve une place, crée le paiement Mollie et redirige vers la page de paiement. */
export async function startCheckoutAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, profile } = await getSessionWithProfile();
  const eventId = str(formData, "event_id");
  const slug = str(formData, "event_slug");
  if (!user) redirect(`/connexion?next=${encodeURIComponent(`/tournois/${slug}/inscription`)}`);
  if (!isProfileComplete(profile)) redirect(`/joueur/profil?next=${encodeURIComponent(`/tournois/${slug}/inscription`)}&raison=inscription`);

  const participantName = str(formData, "participant_name");
  const participantEmail = str(formData, "participant_email").toLowerCase();
  const participantPhone = str(formData, "participant_phone");
  const notes = str(formData, "notes");
  const deckId = str(formData, "deck_id") || null;
  const leaderId = str(formData, "leader_id") || null;
  // Le deck et le leader sont pilotés par React ; le reste doit être renvoyé,
  // sinon une case oubliée efface l'adresse de facturation.
  const values = keepValues(formData, ["participant_name", "participant_email", "participant_phone", "notes", "billing_street", "billing_postal_code", "billing_city", "billing_country", "billing_company", "billing_vat"]);

  const fieldErrors: Record<string, string> = {};
  const e1 = validateFullName(participantName);
  if (e1) fieldErrors.participant_name = e1;
  const e2 = validateEmail(participantEmail);
  if (e2) fieldErrors.participant_email = e2;
  if (!formData.get("accept_rules")) fieldErrors.accept_rules = "Merci d'accepter le règlement.";

  const supabase = await createServerSupabase();
  const { data: event } = await supabase.from("events").select("*").eq("id", eventId).maybeSingle<EventRow>();
  if (!event) return { error: "Tournoi introuvable.", values };

  const totals = computeTotals(event.price_cents, event.fee_bps);
  const billing =
    totals.totalCents > 0
      ? sanitizeBilling(
          {
            streetAndNumber: str(formData, "billing_street"),
            postalCode: str(formData, "billing_postal_code"),
            city: str(formData, "billing_city"),
            country: str(formData, "billing_country"),
            companyName: str(formData, "billing_company") || null,
            vatNumber: str(formData, "billing_vat") || null,
          },
          { name: participantName, email: participantEmail, phone: participantPhone }
        )
      : null;
  if (totals.totalCents > 0 && !billing) {
    fieldErrors.billing = "Adresse de facturation incomplète (rue, code postal, ville, pays à 2 lettres).";
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, error: "Vérifiez les champs signalés.", values };

  // 1) Réservation de place (fonction SQL, verrou sur l'événement)
  const { data: reservedId, error: rErr } = await supabase.rpc("reserve_seat", {
    p_event_id: event.id,
    p_deck_id: deckId,
    p_leader_id: leaderId,
    p_phone: participantPhone || null,
    p_notes: notes || null,
  });
  if (rErr || !reservedId) return { error: humanizeReserveError(rErr?.message ?? ""), values };
  const regId = String(reservedId);

  const admin = createAdminSupabase();
  await admin
    .from("registrations")
    .update({
      participant_name: participantName,
      participant_email: participantEmail,
      participant_phone: participantPhone || null,
      billing_data: billing,
      amount_cents: totals.totalCents,
      currency: safeCurrency(event.currency),
    })
    .eq("id", regId);

  // 2) Tournoi gratuit : confirmation immédiate
  if (totals.totalCents === 0) {
    await markRegistrationPaid(regId, { provider: "free", eventType: "free_registration" });
    try {
      await fulfilRegistration(regId);
    } catch (e) {
      console.error("[inscription gratuite] fulfil", e);
    }
    redirect(`/tournois/inscription/${regId}`);
  }

  // 3) Paiement Mollie
  let checkoutUrl: string;
  try {
    const { data: reg } = await admin.from("registrations").select("*").eq("id", regId).single<RegistrationRow>();
    if (!reg) throw new Error("Inscription introuvable après réservation");
    const mp = await createMolliePaymentFor(reg, event, totals.totalCents, safeCurrency(event.currency));
    checkoutUrl = mp.checkoutUrl;
  } catch (e) {
    console.error("[mollie] création du paiement", e);
    await cancelRegistration(regId, null, "create_payment_failed");
    return { error: humanizeMollieError(e instanceof Error ? e.message : ""), values };
  }
  redirect(checkoutUrl);
}

/** « Payer maintenant » : reprend un paiement en attente (ou en crée un nouveau). */
export async function resumeCheckoutAction(registrationId: string): Promise<ActionState> {
  const { user } = await getSessionWithProfile();
  if (!user) return { error: "Connectez-vous pour reprendre le paiement." };

  const admin = createAdminSupabase();
  const { data: reg } = await admin.from("registrations").select("*").eq("id", registrationId).maybeSingle<RegistrationRow>();
  if (!reg || reg.profile_id !== user.id) return { error: "Inscription introuvable." };
  if (reg.status === "paid" || reg.status === "checked_in") redirect(`/tournois/inscription/${reg.id}`);
  if (reg.status !== "pending_payment") return { error: "Cette inscription n'est plus en attente de paiement." };
  if (!isActiveRegistration(reg, Date.now())) {
    await cancelRegistration(reg.id, reg.mollie_payment_id, "expired");
    return { error: "Votre réservation a expiré. Recommencez l'inscription." };
  }

  const { data: event } = await admin.from("events").select("*").eq("id", reg.event_id).single<EventRow>();
  if (!event) return { error: "Tournoi introuvable." };
  const totals = computeTotals(event.price_cents, event.fee_bps);
  const currency = safeCurrency(event.currency);

  let target: string | null = null;
  try {
    if (reg.mollie_payment_id) {
      const payment = await mollieGetPayment(reg.mollie_payment_id);
      await admin.from("payment_events").insert({ registration_id: reg.id, provider: "mollie", event_type: "resume_get_payment", provider_ref: payment.id, payload: payment });
      await admin.from("registrations").update({ mollie_payment_status: payment.status }).eq("id", reg.id);
      if (payment.status === "paid") {
        await markRegistrationPaid(reg.id, { provider: "mollie", paymentStatus: "paid", eventType: "resume_already_paid" });
        try {
          await fulfilRegistration(reg.id);
        } catch (e) {
          console.error("[resume] fulfil", e);
        }
        target = `/tournois/inscription/${reg.id}`;
      } else {
        const url = mollieCheckoutUrl(payment);
        if (url && isMollieResumable(payment.status)) target = url;
      }
    }
    if (!target) {
      const mp = await createMolliePaymentFor(reg, event, totals.totalCents, currency);
      target = mp.checkoutUrl;
    }
  } catch (e) {
    console.error("[mollie] reprise du paiement", e);
    return { error: humanizeMollieError(e instanceof Error ? e.message : "") };
  }
  redirect(target);
}

/** Annule une réservation en attente (libère la place). */
export async function cancelPendingRegistrationAction(registrationId: string): Promise<ActionState> {
  const { user } = await getSessionWithProfile();
  if (!user) return { error: "Connectez-vous." };
  const admin = createAdminSupabase();
  const { data: reg } = await admin
    .from("registrations")
    .select("id, profile_id, status, mollie_payment_id, event:events(slug)")
    .eq("id", registrationId)
    .maybeSingle<{ id: string; profile_id: string | null; status: string; mollie_payment_id: string | null; event: { slug: string } | null }>();
  if (!reg || reg.profile_id !== user.id) return { error: "Inscription introuvable." };
  if (reg.status !== "pending_payment") return { error: "Cette inscription ne peut plus être annulée en ligne." };
  await cancelRegistration(reg.id, reg.mollie_payment_id, "cancel_by_player");
  redirect(reg.event?.slug ? `/tournois/${reg.event.slug}?msg=annulee` : "/joueur/inscriptions");
}

/** Met à jour le deck / leader déclaré (jusqu'au début du tournoi). */
export async function updateRegistrationDeckAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await getSessionWithProfile();
  if (!user) return { error: "Connectez-vous." };
  const registrationId = str(formData, "registration_id");
  const deckId = str(formData, "deck_id") || null;
  const leaderId = str(formData, "leader_id") || null;

  const admin = createAdminSupabase();
  const { data: reg } = await admin
    .from("registrations")
    .select("id, profile_id, status, event:events(starts_at)")
    .eq("id", registrationId)
    .maybeSingle<{ id: string; profile_id: string | null; status: string; event: { starts_at: string } | null }>();
  if (!reg || reg.profile_id !== user.id) return { error: "Inscription introuvable." };
  if (reg.event && new Date(reg.event.starts_at).getTime() <= Date.now()) return { error: "Le tournoi a déjà commencé." };

  let finalLeader = leaderId;
  if (deckId) {
    const { data: deck } = await admin.from("decks").select("id, profile_id, leader_id").eq("id", deckId).maybeSingle<{ id: string; profile_id: string; leader_id: string | null }>();
    if (!deck || deck.profile_id !== user.id) return { error: "Deck introuvable." };
    finalLeader = finalLeader ?? deck.leader_id;
  }
  await admin.from("registrations").update({ deck_id: deckId, leader_id: finalLeader }).eq("id", reg.id);
  return { ok: true, message: "Deck déclaré mis à jour." };
}
