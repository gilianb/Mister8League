import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import type { DeckRow, LeaderRow } from "./types";

export type DeckWithLeader = DeckRow & { leader: LeaderRow | null };

export async function listMyDecks(includeArchived = false): Promise<DeckWithLeader[]> {
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  let q = supabase.from("decks").select("*, leader:leaders(*)").eq("profile_id", auth.user.id);
  if (!includeArchived) q = q.eq("is_archived", false);
  const { data } = await q.order("updated_at", { ascending: false }).returns<DeckWithLeader[]>();
  return data ?? [];
}

export async function listPublicDecks(profileId: string): Promise<DeckWithLeader[]> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("decks")
    .select("*, leader:leaders(*)")
    .eq("profile_id", profileId)
    .eq("is_public", true)
    .eq("is_archived", false)
    .order("updated_at", { ascending: false })
    .returns<DeckWithLeader[]>();
  return data ?? [];
}

export async function getDeck(id: string): Promise<DeckWithLeader | null> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("decks")
    .select("*, leader:leaders(*)")
    .eq("id", id)
    .maybeSingle<DeckWithLeader>();
  return data ?? null;
}
