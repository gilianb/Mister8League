"use server";

import { getSessionWithProfile } from "@/lib/auth/session";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { hashTicketToken } from "./ticket-token";
import type { ActionState } from "@/lib/auth/actions";

export type TicketStatus = "valid" | "already_checked_in" | "not_paid" | "invalid" | "expired";

type RegForCheckin = { id: string; event_id: string; status: string; checked_in_at: string | null };

async function requireAdminId(): Promise<string | null> {
  const { user, profile } = await getSessionWithProfile();
  if (!user || profile?.role !== "admin") return null;
  return user.id;
}

async function doCheckIn(reg: RegForCheckin, adminId: string, method: string): Promise<ActionState & { status?: TicketStatus }> {
  if (reg.status === "checked_in" || reg.checked_in_at) return { ok: true, status: "already_checked_in", message: "Ce joueur est déjà enregistré comme présent." };
  if (reg.status !== "paid") return { error: "Paiement requis avant le check-in.", status: "not_paid" };

  const admin = createAdminSupabase();
  const now = new Date().toISOString();
  const { data: updated } = await admin
    .from("registrations")
    .update({ status: "checked_in", checked_in_at: now, checked_in_by: adminId })
    .eq("id", reg.id)
    .eq("status", "paid")
    .select("id")
    .maybeSingle();
  if (!updated) return { error: "Impossible de confirmer (statut modifié entre-temps).", status: "invalid" };

  await admin.from("admin_events").insert({
    admin_id: adminId,
    event_id: reg.event_id,
    registration_id: reg.id,
    action: "check_in",
    from_status: "paid",
    to_status: "checked_in",
    payload: { method },
  });
  return { ok: true, status: "valid", message: "Présence confirmée." };
}

/** Check-in depuis la page du billet (QR). Admin uniquement. */
export async function checkInByTokenAction(token: string): Promise<ActionState & { status?: TicketStatus }> {
  const adminId = await requireAdminId();
  if (!adminId) return { error: "Réservé aux organisateurs.", status: "invalid" };

  const admin = createAdminSupabase();
  const { data: tokenRow } = await admin
    .from("ticket_tokens")
    .select("registration_id, expires_at")
    .eq("token_hash", hashTicketToken(token))
    .maybeSingle<{ registration_id: string; expires_at: string | null }>();
  if (!tokenRow) return { error: "Billet invalide.", status: "invalid" };
  if (tokenRow.expires_at && new Date(tokenRow.expires_at).getTime() < Date.now()) return { error: "Billet expiré.", status: "expired" };

  const { data: reg } = await admin
    .from("registrations")
    .select("id, event_id, status, checked_in_at")
    .eq("id", tokenRow.registration_id)
    .maybeSingle<RegForCheckin>();
  if (!reg) return { error: "Inscription introuvable.", status: "invalid" };
  return doCheckIn(reg, adminId, "qr_scan");
}

/** Check-in manuel depuis la liste des participants (admin). */
export async function checkInRegistrationAction(registrationId: string): Promise<ActionState & { status?: TicketStatus }> {
  const adminId = await requireAdminId();
  if (!adminId) return { error: "Réservé aux organisateurs.", status: "invalid" };
  const admin = createAdminSupabase();
  const { data: reg } = await admin
    .from("registrations")
    .select("id, event_id, status, checked_in_at")
    .eq("id", registrationId)
    .maybeSingle<RegForCheckin>();
  if (!reg) return { error: "Inscription introuvable.", status: "invalid" };
  return doCheckIn(reg, adminId, "manual");
}

/** Annule un check-in (erreur de scan). */
export async function undoCheckInAction(registrationId: string): Promise<ActionState> {
  const adminId = await requireAdminId();
  if (!adminId) return { error: "Réservé aux organisateurs." };
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("registrations")
    .update({ status: "paid", checked_in_at: null, checked_in_by: null })
    .eq("id", registrationId)
    .eq("status", "checked_in")
    .select("id, event_id")
    .maybeSingle<{ id: string; event_id: string }>();
  if (!data) return { error: "Aucun check-in à annuler." };
  await admin.from("admin_events").insert({ admin_id: adminId, event_id: data.event_id, registration_id: data.id, action: "undo_check_in", from_status: "checked_in", to_status: "paid" });
  return { ok: true, message: "Check-in annulé." };
}
