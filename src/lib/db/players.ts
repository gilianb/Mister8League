import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import type { PlayerDeckStatRow, PlayerHistoryRow, PlayerRow, PublicProfileRow } from "./types";

export async function getPlayerByProfileId(profileId: string): Promise<PlayerRow | null> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("players")
    .select("*")
    .eq("profile_id", profileId)
    .is("merged_into", null)
    .maybeSingle<PlayerRow>();
  return data ?? null;
}

export async function getPlayerById(id: string): Promise<PlayerRow | null> {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("players").select("*").eq("id", id).maybeSingle<PlayerRow>();
  return data ?? null;
}

export async function getPlayerHistory(playerId: string): Promise<PlayerHistoryRow[]> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("player_history")
    .select("*")
    .eq("player_id", playerId)
    .order("starts_at", { ascending: false })
    .returns<PlayerHistoryRow[]>();
  return data ?? [];
}

export async function getPlayerDeckStats(playerId: string, seasonId?: string | null): Promise<PlayerDeckStatRow[]> {
  const supabase = await createServerSupabase();
  let q = supabase.from("player_deck_stats").select("*").eq("player_id", playerId);
  if (seasonId) q = q.eq("season_id", seasonId);
  const { data } = await q.order("events_played", { ascending: false }).returns<PlayerDeckStatRow[]>();
  return data ?? [];
}

export async function getPublicProfileByPseudo(pseudo: string): Promise<PublicProfileRow | null> {
  const supabase = await createServerSupabase();
  // Échappe les jokers ILIKE : « a_c » ne doit pas correspondre à « abc ».
  const pattern = pseudo.replace(/[%_\\]/g, (m) => `\\${m}`);
  const { data } = await supabase
    .from("public_profiles")
    .select("*")
    .ilike("pseudo", pattern)
    .maybeSingle<PublicProfileRow>();
  return data ?? null;
}

export async function getPublicProfileById(id: string): Promise<PublicProfileRow | null> {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("public_profiles").select("*").eq("id", id).maybeSingle<PublicProfileRow>();
  return data ?? null;
}
