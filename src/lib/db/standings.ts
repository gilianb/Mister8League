import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import type { StandingRow } from "./types";

export async function getSeasonStandings(seasonId: string): Promise<StandingRow[]> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("season_standings")
    .select("*")
    .eq("season_id", seasonId)
    .order("rank", { ascending: true })
    .order("display_name", { ascending: true })
    .returns<StandingRow[]>();
  return data ?? [];
}

export async function getPlayerStanding(seasonId: string, playerId: string): Promise<StandingRow | null> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("season_standings")
    .select("*")
    .eq("season_id", seasonId)
    .eq("player_id", playerId)
    .maybeSingle<StandingRow>();
  return data ?? null;
}

/** Points du dernier joueur actuellement qualifié (ligne de coupe). */
export function cutPoints(standings: StandingRow[], qualifiedCount: number): number {
  if (qualifiedCount <= 0) return 0;
  const cut = standings.find((s) => s.rank === qualifiedCount) ?? standings[qualifiedCount - 1];
  return cut?.total_points ?? 0;
}
