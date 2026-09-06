import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";

/**
 * Client Supabase côté serveur, lié aux cookies de la requête.
 * À utiliser dans les Server Components, Server Actions et Route Handlers
 * qui ont besoin de l'utilisateur connecté (la RLS s'applique).
 */
export async function createServerSupabase(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Les Server Components ne peuvent pas écrire de cookies :
            // le proxy (src/proxy.ts) s'en charge à la requête suivante.
          }
        },
      },
    }
  );
}
