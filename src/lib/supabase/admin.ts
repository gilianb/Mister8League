import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";

/**
 * Client « service role » : contourne la RLS. Serveur uniquement, et
 * toujours après une vérification explicite des droits (requireAdmin /
 * requireUser + contrôle de propriété).
 */
export function createAdminSupabase(): SupabaseClient {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
