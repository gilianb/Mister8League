import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ------------------------------------------------------------------
// Client Supabase.
//
// Tant que .env.local n'est pas renseigné (voir .env.example), le
// client vaut null et le site tourne sur les données de démonstration
// de src/lib/data/seed.ts. Dès que les variables existent, les
// fonctions de src/lib/data/index.ts peuvent basculer sur les vues
// SQL (season_standings, event_metagame, player_deck_stats).
// ------------------------------------------------------------------

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const isSupabaseConfigured = supabase !== null;
