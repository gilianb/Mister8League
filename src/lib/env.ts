// ------------------------------------------------------------------
// Lecture des variables d'environnement.
// Les variables NEXT_PUBLIC_* sont inlinées côté client par Next ; les
// autres ne sont lues que côté serveur.
// ------------------------------------------------------------------

export const PUBLIC_ENV_NAMES = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export const SERVER_ENV_NAMES = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "MOLLIE_API_KEY",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
] as const;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  );
}

/** Variables manquantes, pour la page d'installation. */
export function missingEnv(): string[] {
  const names = [...PUBLIC_ENV_NAMES, ...SERVER_ENV_NAMES];
  return names.filter((n) => !process.env[n]?.trim());
}

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Variable d'environnement manquante : ${name}`);
  return v.trim();
}

/** URL publique du site, sans slash final. */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw && /^https?:\/\//i.test(raw)) return raw.replace(/\/$/, "");
  return "http://localhost:3000";
}

export function envBool(name: string, fallback: boolean): boolean {
  const v = process.env[name];
  if (!v) return fallback;
  return ["true", "1", "yes", "on"].includes(v.trim().toLowerCase());
}
