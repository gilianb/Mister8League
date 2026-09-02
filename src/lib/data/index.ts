import * as seed from "./seed";
import type {
  LeagueEvent,
  Season,
  StandingRow,
  EventResultRow,
  MetagameSlice,
  PlayerDashboard,
} from "../types";

// ------------------------------------------------------------------
// Couche d'accès aux données.
//
// Mode démo (par défaut) : lit le seed local, aucun service requis.
// Mode Supabase : dès que NEXT_PUBLIC_SUPABASE_URL et
// NEXT_PUBLIC_SUPABASE_ANON_KEY sont définis dans .env.local, ces
// fonctions basculeront sur les vues SQL (season_standings,
// event_metagame, player_deck_stats) — même signatures, zéro
// changement dans les pages.
// ------------------------------------------------------------------

export async function getActiveSeason(): Promise<Season> {
  return seed.season;
}

export async function getUpcomingEvents(): Promise<LeagueEvent[]> {
  return seed.events
    .filter((e) => e.status === "published")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export async function getNextEvent(): Promise<LeagueEvent | null> {
  const upcoming = await getUpcomingEvents();
  return upcoming[0] ?? null;
}

export async function getNextEventForGame(
  gameSlug: LeagueEvent["gameSlug"]
): Promise<LeagueEvent | null> {
  const upcoming = await getUpcomingEvents();
  return upcoming.find((e) => e.gameSlug === gameSlug) ?? null;
}

export async function getPastEvents(): Promise<LeagueEvent[]> {
  return seed.events
    .filter((e) => e.status === "completed")
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
}

export async function getStandings(): Promise<StandingRow[]> {
  return seed.standings;
}

export async function getEventBySlug(slug: string): Promise<LeagueEvent | null> {
  return seed.events.find((e) => e.slug === slug) ?? null;
}

export async function getEventResults(slug: string): Promise<EventResultRow[]> {
  return seed.eventResults[slug] ?? [];
}

export async function getEventMetagame(slug: string): Promise<MetagameSlice[]> {
  return seed.eventMetagame[slug] ?? [];
}

export async function getDemoPlayerDashboard(): Promise<PlayerDashboard> {
  return seed.demoPlayer;
}
