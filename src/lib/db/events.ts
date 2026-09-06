import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import type { EventRow, SeatCountsRow } from "./types";

export type EventWithSeats = EventRow & { seats: SeatCountsRow };

const EMPTY_SEATS = (eventId: string): SeatCountsRow => ({
  event_id: eventId,
  active_count: 0,
  paid_count: 0,
  checked_in_count: 0,
});

async function attachSeats(events: EventRow[]): Promise<EventWithSeats[]> {
  if (events.length === 0) return [];
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("event_seat_counts")
    .select("*")
    .in(
      "event_id",
      events.map((e) => e.id)
    )
    .returns<SeatCountsRow[]>();
  const byId = new Map((data ?? []).map((s) => [s.event_id, s]));
  return events.map((e) => ({ ...e, seats: byId.get(e.id) ?? EMPTY_SEATS(e.id) }));
}

/** Tournois publiés à venir (ou en cours depuis moins de 12 h), du plus proche au plus lointain. */
export async function listUpcomingEvents(): Promise<EventWithSeats[]> {
  const supabase = await createServerSupabase();
  const since = new Date(Date.now() - 12 * 3_600_000).toISOString();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .gte("starts_at", since)
    .order("starts_at", { ascending: true })
    .returns<EventRow[]>();
  return attachSeats(data ?? []);
}

export async function getNextEvent(): Promise<EventWithSeats | null> {
  const list = await listUpcomingEvents();
  return list.find((e) => e.is_featured) ?? list[0] ?? null;
}

/** Tournois terminés (résultats publiés), du plus récent au plus ancien. */
export async function listCompletedEvents(): Promise<EventRow[]> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("status", "completed")
    .order("starts_at", { ascending: false })
    .returns<EventRow[]>();
  return data ?? [];
}

/** Tournois passés : terminés, ou publiés dont la date est passée (résultats à venir). */
export async function listPastEvents(): Promise<EventRow[]> {
  const supabase = await createServerSupabase();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("events")
    .select("*")
    .or(`status.eq.completed,and(status.eq.published,starts_at.lt.${now})`)
    .order("starts_at", { ascending: false })
    .returns<EventRow[]>();
  return data ?? [];
}

export async function getEventBySlug(slug: string): Promise<EventWithSeats | null> {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle<EventRow>();
  if (!data) return null;
  const [withSeats] = await attachSeats([data]);
  return withSeats ?? null;
}

export async function getEventById(id: string): Promise<EventWithSeats | null> {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("events").select("*").eq("id", id).maybeSingle<EventRow>();
  if (!data) return null;
  const [withSeats] = await attachSeats([data]);
  return withSeats ?? null;
}

/** Tous les tournois (admin : la RLS laisse passer les brouillons). */
export async function listAllEvents(): Promise<EventWithSeats[]> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("events")
    .select("*")
    .order("starts_at", { ascending: false })
    .returns<EventRow[]>();
  return attachSeats(data ?? []);
}

export async function listSeasonEvents(seasonId: string): Promise<EventRow[]> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("season_id", seasonId)
    .order("starts_at", { ascending: true })
    .returns<EventRow[]>();
  return data ?? [];
}
