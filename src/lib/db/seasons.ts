import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import type { PointScaleRuleRow, SeasonRow } from "./types";
import type { PointRule } from "@/lib/league/points";

export async function getActiveSeason(): Promise<SeasonRow | null> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("seasons")
    .select("*")
    .eq("status", "active")
    .order("starts_on", { ascending: false })
    .limit(1)
    .maybeSingle<SeasonRow>();
  return data ?? null;
}

/** Saisons visibles (les brouillons ne sont visibles que des admins via la RLS). */
export async function listSeasons(): Promise<SeasonRow[]> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("seasons")
    .select("*")
    .order("starts_on", { ascending: false })
    .returns<SeasonRow[]>();
  return data ?? [];
}

export async function getSeasonBySlug(slug: string): Promise<SeasonRow | null> {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("seasons").select("*").eq("slug", slug).maybeSingle<SeasonRow>();
  return data ?? null;
}

export async function getSeasonById(id: string): Promise<SeasonRow | null> {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("seasons").select("*").eq("id", id).maybeSingle<SeasonRow>();
  return data ?? null;
}

export function toPointRules(rows: PointScaleRuleRow[]): PointRule[] {
  return rows
    .map((r) => ({
      label: r.label,
      placementMin: r.placement_min,
      placementMax: r.placement_max,
      points: r.points,
    }))
    .sort((a, b) => a.placementMin - b.placementMin);
}

export async function getPointScale(seasonId: string): Promise<PointRule[]> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("point_scale_rules")
    .select("*")
    .eq("season_id", seasonId)
    .returns<PointScaleRuleRow[]>();
  return toPointRules(data ?? []);
}

export async function getPointScaleRows(seasonId: string): Promise<PointScaleRuleRow[]> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("point_scale_rules")
    .select("*")
    .eq("season_id", seasonId)
    .order("placement_min", { ascending: true })
    .returns<PointScaleRuleRow[]>();
  return data ?? [];
}
