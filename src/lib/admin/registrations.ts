"use server";

import { createAdminSupabase } from "@/lib/supabase/admin";
import type { ActionState } from "@/lib/auth/actions";
import type { EventRow, ProfileRow, RegistrationRow } from "@/lib/db/types";
import { validateEmail, validateFullName } from "@/lib/auth/validation";
import { computeTotals, safeCurrency } from "@/lib/payments/amounts";
import { sanitizeBilling } from "@/lib/payments/billing";
import { fulfilRegistration, markRegistrationPaid, resendTicketEmail } from "@/lib/payments/fulfil";
import { mollieCancelPayment } from "@/lib/payments/mollie";
import { adminUserId, formStr, logAdminEvent } from "./guard";

/** Inscription « cash » (paiement en boutique) créée par l'admin : payée, facturée, billet + e-mail. */
export async function addCashRegistrationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const adminId = await adminUserId();
  if (!adminId) return { error: "Réservé aux organisateurs." };

  const eventId = formStr(formData, "event_id");
  const name = formStr(formData, "participant_name");
  const email = formStr(formData, "participant_email").toLowerCase();
  const phone = formStr(formData, "participant_phone") || null;
  const notes = formStr(formData, "notes") || null;
  const pseudo = formStr(formData, "profile_pseudo");
  const leaderId = formStr(formData, "leader_id") || null;
  const withInvoice = formData.get("with_invoice") === "on";

  const fieldErrors: Record<string, string> = {};
  const e1 = validateFullName(name);
  if (e1) fieldErrors.participant_name = e1;
  const e2 = validateEmail(email);
  if (e2) fieldErrors.participant_email = e2;

  const admin = createAdminSupabase();
  const { data: event } = await admin.from("events").select("*").eq("id", eventId).maybeSingle<EventRow>();
  if (!event) return { error: "Tournoi introuvable." };

  let profileId: string | null = null;
  if (pseudo) {
    const { data: p } = await admin.from("profiles").select("id, pseudo").ilike("pseudo", pseudo.replace(/[%_\\]/g, (m) => `\\${m}`)).maybeSingle<Pick<ProfileRow, "id" | "pseudo">>();
    if (!p) fieldErrors.profile_pseudo = "Aucun compte avec ce pseudo.";
    else {
      profileId = p.id;
      const { data: dup } = await admin.from("registrations").select("id").eq("event_id", eventId).eq("profile_id", p.id).in("status", ["pending_payment", "paid", "checked_in"]).limit(1);
      if (dup && dup.length > 0) fieldErrors.profile_pseudo = "Ce joueur a déjà une inscription active pour ce tournoi.";
    }
  }

  const totals = computeTotals(event.price_cents, 0);
  const billing = withInvoice
    ? sanitizeBilling(
        {
          streetAndNumber: formStr(formData, "billing_street"),
          postalCode: formStr(formData, "billing_postal_code"),
          city: formStr(formData, "billing_city"),
          country: formStr(formData, "billing_country") || "FR",
          companyName: formStr(formData, "billing_company") || null,
          vatNumber: formStr(formData, "billing_vat") || null,
        },
        { name, email, phone }
      )
    : null;
  if (withInvoice && !billing) fieldErrors.billing = "Adresse de facturation incomplète.";
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, error: "Vérifiez les champs signalés." };

  // Capacité (places actives)
  const { data: seats } = await admin.from("event_seat_counts").select("active_count").eq("event_id", eventId).maybeSingle<{ active_count: number }>();
  if (event.capacity > 0 && (seats?.active_count ?? 0) >= event.capacity) {
    return { error: "Le tournoi est complet." };
  }

  const { data: reg, error } = await admin
    .from("registrations")
    .insert({
      event_id: eventId,
      profile_id: profileId,
      status: "paid",
      participant_name: name,
      participant_email: email,
      participant_phone: phone,
      notes,
      leader_id: leaderId,
      payment_provider: "cash",
      amount_cents: totals.totalCents,
      currency: safeCurrency(event.currency),
      billing_data: billing,
      paid_at: new Date().toISOString(),
    })
    .select("*")
    .single<RegistrationRow>();
  if (error || !reg) return { error: error?.message ?? "Création impossible." };

  await admin.from("payment_events").insert({ registration_id: reg.id, provider: "cash", event_type: "admin_cash_paid", provider_ref: `cash:${reg.id}`, payload: { adminId, totalCents: totals.totalCents } });
  await logAdminEvent({ adminId, action: "cash_registration", eventId, registrationId: reg.id, toStatus: "paid" });

  let warnings: string[] = [];
  try {
    const result = await fulfilRegistration(reg.id);
    warnings = result.warnings;
  } catch (e) {
    warnings.push(e instanceof Error ? e.message : "Billet / e-mail non générés.");
  }
  return { ok: true, message: `Participant ajouté (${name}).${warnings.length ? ` Avertissements : ${warnings.join(" · ")}` : ""}` };
}

/** Passe manuellement une réservation en payée (paiement reçu hors ligne). */
export async function markPaidManuallyAction(registrationId: string): Promise<ActionState> {
  const adminId = await adminUserId();
  if (!adminId) return { error: "Réservé aux organisateurs." };
  const admin = createAdminSupabase();
  const { data: reg } = await admin.from("registrations").select("id, status, event_id, mollie_payment_id").eq("id", registrationId).maybeSingle<{ id: string; status: string; event_id: string; mollie_payment_id: string | null }>();
  if (!reg) return { error: "Inscription introuvable." };
  if (reg.status === "paid" || reg.status === "checked_in") return { error: "Déjà payée." };
  await markRegistrationPaid(reg.id, { provider: "cash", eventType: "admin_mark_paid", payload: { adminId } });
  if (reg.mollie_payment_id) await mollieCancelPayment(reg.mollie_payment_id);
  await logAdminEvent({ adminId, action: "mark_paid", eventId: reg.event_id, registrationId: reg.id, fromStatus: reg.status, toStatus: "paid" });
  try {
    await fulfilRegistration(reg.id);
  } catch (e) {
    return { ok: true, message: `Marquée payée, mais billet/e-mail en erreur : ${e instanceof Error ? e.message : "?"}` };
  }
  return { ok: true, message: "Inscription marquée payée, billet envoyé." };
}

/** Annule (ou rembourse) une inscription : la place est libérée. */
export async function cancelRegistrationAction(registrationId: string, mode: "cancelled" | "refunded" = "cancelled"): Promise<ActionState> {
  const adminId = await adminUserId();
  if (!adminId) return { error: "Réservé aux organisateurs." };
  const admin = createAdminSupabase();
  const { data: reg } = await admin.from("registrations").select("id, status, event_id, mollie_payment_id").eq("id", registrationId).maybeSingle<{ id: string; status: string; event_id: string; mollie_payment_id: string | null }>();
  if (!reg) return { error: "Inscription introuvable." };
  if (reg.status === "cancelled" || reg.status === "refunded") return { error: "Déjà annulée." };
  const { error } = await admin.from("registrations").update({ status: mode, expires_at: null }).eq("id", reg.id);
  if (error) return { error: error.message };
  if (reg.status === "pending_payment" && reg.mollie_payment_id) await mollieCancelPayment(reg.mollie_payment_id);
  await logAdminEvent({ adminId, action: mode === "refunded" ? "refund" : "cancel_registration", eventId: reg.event_id, registrationId: reg.id, fromStatus: reg.status, toStatus: mode });
  return { ok: true, message: mode === "refunded" ? "Inscription marquée remboursée (le remboursement Mollie se fait depuis le dashboard Mollie)." : "Inscription annulée." };
}

export async function deleteRegistrationAction(registrationId: string): Promise<ActionState> {
  const adminId = await adminUserId();
  if (!adminId) return { error: "Réservé aux organisateurs." };
  const admin = createAdminSupabase();
  const { data: reg } = await admin.from("registrations").select("id, status, event_id, participant_name").eq("id", registrationId).maybeSingle<{ id: string; status: string; event_id: string; participant_name: string }>();
  if (!reg) return { error: "Inscription introuvable." };
  if (reg.status === "paid" || reg.status === "checked_in") return { error: "Annulez ou remboursez d'abord une inscription payée." };
  const { error } = await admin.from("registrations").delete().eq("id", reg.id);
  if (error) return { error: error.message };
  await logAdminEvent({ adminId, action: "delete_registration", eventId: reg.event_id, note: `${reg.participant_name} (${reg.id})` });
  return { ok: true, message: "Inscription supprimée." };
}

export async function resendTicketAction(registrationId: string): Promise<ActionState> {
  const adminId = await adminUserId();
  if (!adminId) return { error: "Réservé aux organisateurs." };
  try {
    const warnings = await resendTicketEmail(registrationId);
    await logAdminEvent({ adminId, action: "resend_ticket", registrationId });
    return warnings.length ? { ok: true, message: `Envoyé avec avertissements : ${warnings.join(" · ")}` } : { ok: true, message: "Billet renvoyé par e-mail." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Envoi impossible." };
  }
}
