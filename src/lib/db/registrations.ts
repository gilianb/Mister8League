import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import type { EventRow, LeaderRow, RegistrationRow } from "./types";

export type RegistrationWithEvent = RegistrationRow & { event: EventRow; leader: LeaderRow | null };

/** Inscriptions du joueur connecté (RLS « own »), les plus récentes d'abord. */
export async function getMyRegistrations(): Promise<RegistrationWithEvent[]> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("registrations")
    .select("*, event:events(*), leader:leaders(*)")
    .order("created_at", { ascending: false })
    .returns<RegistrationWithEvent[]>();
  return (data ?? []).filter((r) => r.event);
}

/** Inscription « vivante » du joueur connecté pour un tournoi. */
export async function getMyActiveRegistration(eventId: string): Promise<RegistrationRow | null> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("registrations")
    .select("*")
    .eq("event_id", eventId)
    .in("status", ["pending_payment", "paid", "checked_in"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<RegistrationRow>();
  if (!data) return null;
  if (data.status === "pending_payment" && data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) {
    return null;
  }
  return data;
}

export async function getMyRegistrationById(id: string): Promise<RegistrationWithEvent | null> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("registrations")
    .select("*, event:events(*), leader:leaders(*)")
    .eq("id", id)
    .maybeSingle<RegistrationWithEvent>();
  return data ?? null;
}
