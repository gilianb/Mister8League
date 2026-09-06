"use server";

import { redirect } from "next/navigation";
import { createAdminSupabase } from "@/lib/supabase/admin";
import type { ActionState } from "@/lib/auth/actions";
import type { EventStatus } from "@/lib/db/types";
import { slugify } from "@/lib/slug";
import { eurosInputToCents } from "@/lib/money";
import { parisLocalInputToIso } from "@/lib/tournaments/time";
import { adminUserId, formStr, logAdminEvent } from "./guard";

const STATUSES: EventStatus[] = ["draft", "published", "cancelled", "completed"];

function optionalIso(fd: FormData, key: string, fieldErrors: Record<string, string>, label: string): string | null {
  const raw = formStr(fd, key);
  if (!raw) return null;
  const iso = parisLocalInputToIso(raw);
  if (!iso) fieldErrors[key] = `${label} : date invalide.`;
  return iso || null;
}

export async function saveEventAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const adminId = await adminUserId();
  if (!adminId) return { error: "Réservé aux organisateurs." };

  const id = formStr(formData, "id") || null;
  const title = formStr(formData, "title");
  const slug = slugify(formStr(formData, "slug") || title);
  const status = formStr(formData, "status") as EventStatus;
  const fieldErrors: Record<string, string> = {};

  if (title.length < 3) fieldErrors.title = "Titre requis (3 caractères minimum).";
  if (!slug) fieldErrors.slug = "Slug requis.";
  if (!STATUSES.includes(status)) fieldErrors.status = "Statut invalide.";

  const startsAt = parisLocalInputToIso(formStr(formData, "starts_at"));
  if (!startsAt) fieldErrors.starts_at = "Date et heure de début requises.";
  const endsAt = optionalIso(formData, "ends_at", fieldErrors, "Fin");
  const openAt = optionalIso(formData, "registration_open_at", fieldErrors, "Ouverture des inscriptions");
  const closeAt = optionalIso(formData, "registration_close_at", fieldErrors, "Clôture des inscriptions");

  const capacity = Math.max(0, Math.floor(Number(formStr(formData, "capacity") || 0)));
  const priceCents = eurosInputToCents(formStr(formData, "price_euros"));
  const feeBps = Math.max(0, Math.floor(Number(formStr(formData, "fee_bps") || 0)));
  const rounds = formStr(formData, "rounds") ? Math.max(1, Math.floor(Number(formStr(formData, "rounds")))) : null;
  if (!Number.isFinite(capacity)) fieldErrors.capacity = "Capacité invalide.";
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, error: "Vérifiez les champs signalés." };

  const admin = createAdminSupabase();
  const { data: game } = await admin.from("games").select("id").eq("slug", "one-piece").single<{ id: string }>();
  if (!game) return { error: "Jeu « one-piece » introuvable en base (exécutez 0002_seed.sql)." };

  const { data: clash } = await admin.from("events").select("id").eq("slug", slug).limit(1);
  if (clash && clash.length > 0 && clash[0].id !== id) return { fieldErrors: { slug: "Ce slug est déjà utilisé." }, error: "Slug déjà pris." };

  const payload = {
    game_id: game.id,
    season_id: formStr(formData, "season_id") || null,
    slug,
    title,
    subtitle: formStr(formData, "subtitle") || null,
    description: formStr(formData, "description") || null,
    rules_text: formStr(formData, "rules_text") || null,
    schedule_text: formStr(formData, "schedule_text") || null,
    prizes_text: formStr(formData, "prizes_text") || null,
    format_label: formStr(formData, "format_label") || null,
    venue_name: formStr(formData, "venue_name") || null,
    venue_address: formStr(formData, "venue_address") || null,
    city: formStr(formData, "city") || "Courbevoie",
    google_maps_url: formStr(formData, "google_maps_url") || null,
    starts_at: startsAt,
    ends_at: endsAt,
    registration_open_at: openAt,
    registration_close_at: closeAt,
    capacity,
    price_cents: priceCents,
    fee_bps: feeBps,
    currency: "EUR",
    cover_image_url: formStr(formData, "cover_image_url") || null,
    is_featured: formData.get("is_featured") === "on",
    counts_for_league: formData.get("counts_for_league") === "on",
    rounds,
    status,
  };

  if (id) {
    const { error } = await admin.from("events").update(payload).eq("id", id);
    if (error) return { error: error.message };
    await logAdminEvent({ adminId, action: "event_update", eventId: id, toStatus: status });
    return { ok: true, message: "Tournoi enregistré." };
  }

  const { data, error } = await admin.from("events").insert({ ...payload, created_by: adminId }).select("id").single<{ id: string }>();
  if (error || !data) return { error: error?.message ?? "Création impossible." };
  await logAdminEvent({ adminId, action: "event_create", eventId: data.id, toStatus: status });
  redirect(`/admin/tournois/${data.id}?msg=cree`);
}

export async function setEventStatusAction(eventId: string, status: EventStatus): Promise<ActionState> {
  const adminId = await adminUserId();
  if (!adminId) return { error: "Réservé aux organisateurs." };
  if (!STATUSES.includes(status)) return { error: "Statut invalide." };
  const admin = createAdminSupabase();
  const { data: before } = await admin.from("events").select("status").eq("id", eventId).maybeSingle<{ status: string }>();
  if (!before) return { error: "Tournoi introuvable." };
  if (status === "completed") {
    const { count } = await admin.from("results").select("id", { count: "exact", head: true }).eq("event_id", eventId);
    if (!count) return { error: "Publiez d'abord les résultats (import CSV) : le statut « terminé » est appliqué automatiquement." };
  }
  const { error } = await admin.from("events").update({ status }).eq("id", eventId);
  if (error) return { error: error.message };
  await logAdminEvent({ adminId, action: "event_status", eventId, fromStatus: before.status, toStatus: status });
  return { ok: true, message: "Statut mis à jour." };
}

export async function deleteEventAction(eventId: string): Promise<ActionState> {
  const adminId = await adminUserId();
  if (!adminId) return { error: "Réservé aux organisateurs." };
  const admin = createAdminSupabase();
  const [{ count: results }, { count: paid }] = await Promise.all([
    admin.from("results").select("id", { count: "exact", head: true }).eq("event_id", eventId),
    admin.from("registrations").select("id", { count: "exact", head: true }).eq("event_id", eventId).in("status", ["paid", "checked_in"]),
  ]);
  if (results) return { error: "Ce tournoi a des résultats publiés : il ne peut pas être supprimé." };
  if (paid) return { error: "Ce tournoi a des inscriptions payées : annulez-le plutôt (statut « annulé »)." };
  const { error } = await admin.from("events").delete().eq("id", eventId);
  if (error) return { error: error.message };
  await logAdminEvent({ adminId, action: "event_delete", eventId: null, note: eventId });
  redirect("/admin/tournois?msg=supprime");
}
