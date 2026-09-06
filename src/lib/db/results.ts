import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import type { EventResultPublicRow, MetagameRow } from "./types";

export async function getEventResults(eventId: string): Promise<EventResultPublicRow[]> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("event_results_public")
    .select("*")
    .eq("event_id", eventId)
    .order("placement", { ascending: true })
    .returns<EventResultPublicRow[]>();
  return data ?? [];
}

export async function getEventMetagame(eventId: string): Promise<MetagameRow[]> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("event_metagame")
    .select("*")
    .eq("event_id", eventId)
    .order("players_count", { ascending: false })
    .order("best_placement", { ascending: true })
    .returns<MetagameRow[]>();
  return data ?? [];
}

export type MetagameSlice = {
  leaderId: string | null;
  leaderName: string;
  leaderCode: string | null;
  imageUrl: string | null;
  count: number;
  bestPlacement: number;
};

/** Regroupe au-delà de `max` leaders dans « Autres leaders ». */
export function toMetagameSlices(rows: MetagameRow[], max = 7): MetagameSlice[] {
  const slices: MetagameSlice[] = rows.map((r) => ({
    leaderId: r.leader_id,
    leaderName: r.leader_name,
    leaderCode: r.leader_code,
    imageUrl: r.image_url,
    count: r.players_count,
    bestPlacement: r.best_placement,
  }));
  if (slices.length <= max) return slices;
  const head = slices.slice(0, max - 1);
  const rest = slices.slice(max - 1);
  head.push({
    leaderId: null,
    leaderName: "Autres leaders",
    leaderCode: null,
    imageUrl: null,
    count: rest.reduce((s, x) => s + x.count, 0),
    bestPlacement: Math.min(...rest.map((x) => x.bestPlacement)),
  });
  return head;
}
