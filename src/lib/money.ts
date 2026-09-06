const fmtCache = new Map<string, Intl.NumberFormat>();

/** "35,00 €" à partir de centimes. */
export function formatEuros(cents: number, currency = "EUR"): string {
  const cur = (currency || "EUR").toUpperCase();
  let f = fmtCache.get(cur);
  if (!f) {
    f = new Intl.NumberFormat("fr-FR", { style: "currency", currency: cur });
    fmtCache.set(cur, f);
  }
  return f.format((Number(cents) || 0) / 100);
}

/** Saisie en euros ("35", "35,50") → centimes. */
export function eurosInputToCents(raw: string): number {
  const n = Number(String(raw ?? "").replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export function centsToEurosInput(cents: number | null | undefined): string {
  return ((Number(cents) || 0) / 100).toFixed(2);
}
