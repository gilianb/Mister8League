import type { BillingData } from "@/lib/db/types";

export const DEFAULT_LOCALE = "fr_FR";

export function isIso2Country(v: string): boolean {
  return /^[A-Z]{2}$/.test(String(v || "").trim().toUpperCase());
}

export function splitName(fullName: string): { givenName: string | null; familyName: string | null } {
  const s = (fullName ?? "").trim().replace(/\s+/g, " ");
  if (!s) return { givenName: null, familyName: null };
  const parts = s.split(" ");
  if (parts.length === 1) return { givenName: parts[0], familyName: null };
  return { givenName: parts[0], familyName: parts.slice(1).join(" ") };
}

export type BillingInput = {
  streetAndNumber?: string | null;
  streetAdditional?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  companyName?: string | null;
  vatNumber?: string | null;
};

/** Construit l'adresse de facturation Mollie ; null si incomplète. */
export function sanitizeBilling(
  input: BillingInput | null | undefined,
  participant: { name: string; email: string; phone?: string | null }
): BillingData | null {
  if (!input) return null;
  const streetAndNumber = String(input.streetAndNumber ?? "").trim();
  const postalCode = String(input.postalCode ?? "").trim();
  const city = String(input.city ?? "").trim();
  const country = String(input.country ?? "").trim().toUpperCase();
  if (streetAndNumber.length < 3 || postalCode.length < 2 || city.length < 2 || !isIso2Country(country)) return null;

  const organizationName = String(input.companyName ?? "").trim() || null;
  const vatNumber = String(input.vatNumber ?? "").trim() || null;
  const { givenName, familyName } = splitName(participant.name);

  return {
    type: organizationName ? "business" : "consumer",
    locale: DEFAULT_LOCALE,
    email: participant.email.trim().toLowerCase(),
    phone: (participant.phone ?? "").trim() || null,
    streetAndNumber,
    streetAdditional: String(input.streetAdditional ?? "").trim() || null,
    postalCode,
    city,
    region: null,
    country,
    givenName,
    familyName,
    organizationName,
    organizationNumber: null,
    vatNumber,
    title: null,
  };
}

/** Relit une adresse stockée en base (jsonb) et vérifie qu'elle est exploitable. */
export function billingFromStored(value: unknown): BillingData | null {
  if (!value || typeof value !== "object") return null;
  const r = value as Record<string, unknown>;
  const str = (k: string) => (typeof r[k] === "string" ? (r[k] as string).trim() : "");
  const email = str("email");
  const streetAndNumber = str("streetAndNumber");
  const postalCode = str("postalCode");
  const city = str("city");
  const country = str("country").toUpperCase();
  if (!email || !streetAndNumber || !postalCode || !city || !isIso2Country(country)) return null;
  return {
    type: r.type === "business" ? "business" : "consumer",
    locale: str("locale") || DEFAULT_LOCALE,
    email,
    phone: str("phone") || null,
    streetAndNumber,
    streetAdditional: str("streetAdditional") || null,
    postalCode,
    city,
    region: str("region") || null,
    country,
    givenName: str("givenName") || null,
    familyName: str("familyName") || null,
    organizationName: str("organizationName") || null,
    organizationNumber: str("organizationNumber") || null,
    vatNumber: str("vatNumber") || null,
    title: str("title") || null,
  };
}
