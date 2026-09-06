import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import type { LeaderRow } from "./types";

export async function listLeaders(): Promise<LeaderRow[]> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("leaders")
    .select("*")
    .order("code", { ascending: true })
    .returns<LeaderRow[]>();
  return data ?? [];
}

/** Forme légère pour les sélecteurs côté client. */
export type LeaderOption = { id: string; code: string | null; name: string; colors: string[]; imageUrl: string | null };

export function toLeaderOptions(rows: LeaderRow[]): LeaderOption[] {
  return rows.map((l) => ({ id: l.id, code: l.code, name: l.name, colors: l.colors, imageUrl: l.image_url }));
}
