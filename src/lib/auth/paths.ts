/** Empêche les redirections ouvertes : n'accepte qu'un chemin relatif du site. */
export function safeNextPath(input: string | null | undefined, fallback = "/joueur"): string {
  const v = (input ?? "").trim();
  if (!v) return fallback;
  if (!v.startsWith("/") || v.startsWith("//") || v.startsWith("/\\")) return fallback;
  return v;
}
