"use server";

import { createAdminSupabase } from "@/lib/supabase/admin";
import type { ActionState } from "@/lib/auth/actions";
import { normalizeBandaiId, validateBandaiId } from "@/lib/auth/validation";
import { adminUserId, formStr, logAdminEvent } from "./guard";

export async function updatePlayerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const adminId = await adminUserId();
  if (!adminId) return { error: "Réservé aux organisateurs." };
  const id = formStr(formData, "id");
  const displayName = formStr(formData, "display_name");
  const bandaiRaw = formStr(formData, "bandai_member_id");
  if (displayName.length < 2) return { error: "Nom requis." };
  const bandai = bandaiRaw ? normalizeBandaiId(bandaiRaw) : null;
  if (bandai) {
    const err = validateBandaiId(bandai);
    if (err) return { error: err };
  }
  const admin = createAdminSupabase();
  if (bandai) {
    const { data: clash } = await admin.from("players").select("id").eq("bandai_member_id", bandai).neq("id", id).limit(1);
    if (clash && clash.length > 0) return { error: "Un autre joueur porte déjà ce numéro Bandai (utilisez « Fusionner »)." };
  }
  const { error } = await admin.from("players").update({ display_name: displayName, bandai_member_id: bandai }).eq("id", id);
  if (error) return { error: error.message };
  await logAdminEvent({ adminId, action: "player_update", payload: { playerId: id } });
  return { ok: true, message: "Joueur mis à jour." };
}

/** Rattache une identité ligue (souvent importée d'un CSV) à un compte joueur. */
export async function linkPlayerToProfileAction(playerId: string, pseudo: string): Promise<ActionState> {
  const adminId = await adminUserId();
  if (!adminId) return { error: "Réservé aux organisateurs." };
  const admin = createAdminSupabase();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, pseudo, bandai_member_id")
    .ilike("pseudo", pseudo.trim().replace(/[%_\\]/g, (m) => `\\${m}`))
    .maybeSingle<{ id: string; pseudo: string | null; bandai_member_id: string | null }>();
  if (!profile) return { error: "Aucun compte avec ce pseudo." };

  const { data: player } = await admin.from("players").select("id, bandai_member_id, profile_id").eq("id", playerId).maybeSingle<{ id: string; bandai_member_id: string | null; profile_id: string | null }>();
  if (!player) return { error: "Joueur introuvable." };
  if (player.profile_id === profile.id) return { ok: true, message: "Déjà rattaché à ce compte." };

  // Le compte a déjà une identité ligue : on y fusionne celle-ci.
  const { data: existing } = await admin.from("players").select("id").eq("profile_id", profile.id).is("merged_into", null).maybeSingle<{ id: string }>();
  if (existing && existing.id !== player.id) {
    const { error } = await admin.rpc("merge_players", { p_source: player.id, p_target: existing.id });
    if (error) return { error: error.message };
    if (!profile.bandai_member_id && player.bandai_member_id) {
      await admin.from("profiles").update({ bandai_member_id: player.bandai_member_id }).eq("id", profile.id);
    }
    await logAdminEvent({ adminId, action: "player_merge_into_account", payload: { source: player.id, target: existing.id, profileId: profile.id } });
    return { ok: true, message: `Résultats fusionnés dans le compte ${profile.pseudo}.` };
  }

  const { error } = await admin.from("players").update({ profile_id: profile.id }).eq("id", player.id);
  if (error) return { error: error.message };
  if (!profile.bandai_member_id && player.bandai_member_id) {
    await admin.from("profiles").update({ bandai_member_id: player.bandai_member_id }).eq("id", profile.id);
  }
  await logAdminEvent({ adminId, action: "player_link_profile", payload: { playerId: player.id, profileId: profile.id } });
  return { ok: true, message: `Joueur rattaché au compte ${profile.pseudo}.` };
}

export async function unlinkPlayerAction(playerId: string): Promise<ActionState> {
  const adminId = await adminUserId();
  if (!adminId) return { error: "Réservé aux organisateurs." };
  const admin = createAdminSupabase();
  const { error } = await admin.from("players").update({ profile_id: null }).eq("id", playerId);
  if (error) return { error: error.message };
  await logAdminEvent({ adminId, action: "player_unlink_profile", payload: { playerId } });
  return { ok: true, message: "Compte détaché." };
}

/** Fusionne `sourceId` dans `targetId` (résultats déplacés, source archivée). */
export async function mergePlayersAction(sourceId: string, targetId: string): Promise<ActionState> {
  const adminId = await adminUserId();
  if (!adminId) return { error: "Réservé aux organisateurs." };
  if (sourceId === targetId) return { error: "Choisissez deux joueurs différents." };
  const admin = createAdminSupabase();
  const { error } = await admin.rpc("merge_players", { p_source: sourceId, p_target: targetId });
  if (error) return { error: error.message };
  await logAdminEvent({ adminId, action: "player_merge", payload: { source: sourceId, target: targetId } });
  return { ok: true, message: "Joueurs fusionnés." };
}
