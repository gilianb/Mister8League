// Calcul des montants d'inscription (centimes). Module pur.

export function computeTotals(priceCents: number, feeBps: number) {
  const subtotalCents = Math.max(0, Math.floor(Number(priceCents) || 0));
  const bps = Math.max(0, Math.floor(Number(feeBps) || 0));
  const feeCents = Math.round((subtotalCents * bps) / 10_000);
  return { subtotalCents, feeCents, totalCents: subtotalCents + feeCents };
}

/** Montant Mollie : chaîne décimale à deux décimales, ex. "36.75". */
export function centsToMollieValue(cents: number): string {
  return (Math.round(Number(cents) || 0) / 100).toFixed(2);
}

export function mollieValueToCents(value: string | undefined | null): number | null {
  const n = Number(String(value ?? "").replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

export function safeCurrency(cur: unknown): string {
  const c = String(cur || "EUR").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(c) ? c : "EUR";
}
