"use server";

import { createAdminSupabase } from "@/lib/supabase/admin";
import type { ActionState } from "@/lib/auth/actions";
import type { SeasonStatus } from "@/lib/db/types";
import { slugify } from "@/lib/slug";
import { adminUserId, formStr, logAdminEvent } from "./guard";

const STATUSES: SeasonStatus[] = ["draft", "active", "closed"];

export async function saveSeasonAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const adminId = await adminUserId();
  if (!adminId) return { error: "Réservé aux organisateurs." };

  const id = formStr(formData, "id") || null;
  const name = formStr(formData, "name");
  const slug = slugify(formStr(formData, "slug") || name);
  const startsOn = formStr(formData, "starts_on");
  const endsOn = formStr(formData, "ends_on") || null;
  const qualified = Math.max(0, Math.floor(Number(formStr(formData, "qualified_count") || 16)));
  const status = (formStr(formData, "status") || "draft") as SeasonStatus;

  const fieldErrors: Record<string, string> = {};
  if (name.length < 3) fieldErrors.name = "Nom requis (ex. Saison 2026/2027).";
  if (!slug) fieldErrors.slug = "Slug requis.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startsOn)) fieldErrors.starts_on = "Date de début requise.";
  if (endsOn && !/^\d{4}-\d{2}-\d{2}$/.test(endsOn)) fieldErrors.ends_on = "Date de fin invalide.";
  if (!STATUSES.includes(status)) fieldErrors.status = "Statut invalide.";
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, error: "Vérifiez les champs signalés." };

  const admin = createAdminSupabase();
  const { data: game } = await admin.from("games").select("id").eq("slug", "one-piece").single<{ id: string }>();
  if (!game) return { error: "Jeu « one-piece » introuvable (exécutez 0002_seed.sql)." };

  const { data: clash } = await admin.from("seasons").select("id").eq("slug", slug).limit(1);
  if (clash && clash.length > 0 && clash[0].id !== id) return { fieldErrors: { slug: "Ce slug existe déjà." }, error: "Slug déjà pris." };

  if (status === "active") {
    // Une seule saison active : les autres passent en « closed ».
    let q = admin.from("seasons").update({ status: "closed" }).eq("game_id", game.id).eq("status", "active");
    if (id) q = q.neq("id", id);
    await q;
  }

  const payload = { game_id: game.id, name, slug, starts_on: startsOn, ends_on: endsOn, qualified_count: qualified, status };
  if (id) {
    const { error } = await admin.from("seasons").update(payload).eq("id", id);
    if (error) return { error: error.message };
    await logAdminEvent({ adminId, action: "season_update", payload: { seasonId: id } });
    return { ok: true, message: "Saison enregistrée." };
  }
  const { data, error } = await admin.from("seasons").insert(payload).select("id").single<{ id: string }>();
  if (error || !data) return { error: error?.message ?? "Création impossible." };

  // Barème par défaut pour démarrer.
  await admin.from("point_scale_rules").insert(
    [
      ["1er", 1, 1, 15],
      ["2ème", 2, 2, 10],
      ["Top 4", 3, 4, 8],
      ["Top 8", 5, 8, 6],
      ["Top 16", 9, 16, 4],
      ["Top 32", 17, 32, 2],
      ["Top 33-64", 33, 64, 1],
    ].map(([label, min, max, points]) => ({ season_id: data.id, label, placement_min: min, placement_max: max, points }))
  );
  await logAdminEvent({ adminId, action: "season_create", payload: { seasonId: data.id } });
  return { ok: true, message: "Saison créée avec le barème par défaut." };
}

/** Remplace le barème d'une saison et recalcule les points de tous ses tournois. */
export async function savePointScaleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const adminId = await adminUserId();
  if (!adminId) return { error: "Réservé aux organisateurs." };
  const seasonId = formStr(formData, "season_id");
  if (!seasonId) return { error: "Saison manquante." };

  const labels = formData.getAll("rule_label").map(String);
  const mins = formData.getAll("rule_min").map(String);
  const maxs = formData.getAll("rule_max").map(String);
  const pts = formData.getAll("rule_points").map(String);

  const rules: Array<{ season_id: string; label: string; placement_min: number; placement_max: number | null; points: number }> = [];
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i].trim();
    const min = Math.floor(Number(mins[i]));
    const max = maxs[i].trim() ? Math.floor(Number(maxs[i])) : null;
    const points = Math.floor(Number(pts[i]));
    if (!label && !mins[i] && !pts[i]) continue; // ligne vide
    if (!label || !Number.isFinite(min) || min < 1 || !Number.isFinite(points) || points < 0 || (max !== null && (!Number.isFinite(max) || max < min))) {
      return { error: `Ligne ${i + 1} invalide : libellé, placement min ≥ 1, max ≥ min (ou vide), points ≥ 0.` };
    }
    rules.push({ season_id: seasonId, label, placement_min: min, placement_max: max, points });
  }

  const admin = createAdminSupabase();
  const { error: delErr } = await admin.from("point_scale_rules").delete().eq("season_id", seasonId);
  if (delErr) return { error: delErr.message };
  if (rules.length > 0) {
    const { error } = await admin.from("point_scale_rules").insert(rules);
    if (error) return { error: error.message };
  }
  await admin.rpc("apply_league_points_for_season", { p_season: seasonId });
  await logAdminEvent({ adminId, action: "point_scale_update", payload: { seasonId, rules: rules.length } });
  return { ok: true, message: "Barème enregistré et points de la saison recalculés." };
}
