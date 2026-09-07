// ------------------------------------------------------------------
// URL de webhook Mollie. Module pur (testable, sans process.env).
//
// Mollie appelle le webhook depuis ses propres serveurs et refuse la
// création du paiement (HTTP 422, « The webhook URL is invalid because it
// is unreachable from Mollie's point of view ») si l'URL pointe vers une
// machine qu'il ne peut pas joindre — typiquement `http://localhost:3000`
// en développement. On omet donc le webhook dans ce cas : la page
// /tournois/paiement/retour re-interroge Mollie et confirme l'inscription.
// Pour tester le webhook en local, exposer le site via un tunnel
// (ngrok, cloudflared) et renseigner MOLLIE_WEBHOOK_URL.
// ------------------------------------------------------------------

export const MOLLIE_WEBHOOK_PATH = "/api/mollie/webhook";

/** Plages IPv4 non routables sur Internet (RFC 1918, loopback, link-local…). */
function isPrivateIPv4(hostname: string): boolean {
  const parts = hostname.split(".");
  if (parts.length !== 4) return false;
  const [a, b] = parts.map((p) => Number(p));
  if (parts.some((p) => !/^\d{1,3}$/.test(p)) || [a, b].some((n) => !Number.isFinite(n))) return false;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

/** L'URL est-elle atteignable depuis l'extérieur (donc utilisable comme webhook) ? */
export function isPubliclyReachableUrl(value: string | null | undefined): boolean {
  const raw = String(value ?? "").trim();
  if (!raw) return false;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;

  // `new URL` conserve les crochets des adresses IPv6 : [::1] → "[::1]".
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host) return false;
  if (host === "localhost" || host.endsWith(".localhost")) return false;
  if (host === "::" || host === "::1") return false;
  if (isPrivateIPv4(host)) return false;
  // TLD réservés aux réseaux locaux / aux tests.
  if (/\.(local|localdomain|internal|test|example|invalid)$/.test(host)) return false;

  return true;
}

/**
 * URL de webhook à envoyer à Mollie, ou `null` s'il faut l'omettre.
 * `override` (MOLLIE_WEBHOOK_URL) l'emporte sur l'URL du site ; un chemin
 * absent y est complété par la route du webhook.
 */
export function resolveMollieWebhookUrl(siteUrl: string, override?: string | null): string | null {
  const raw = String(override ?? "").trim();
  if (raw) {
    if (!isPubliclyReachableUrl(raw)) return null;
    const url = new URL(raw);
    if (url.pathname === "/" ) url.pathname = MOLLIE_WEBHOOK_PATH;
    return url.toString().replace(/\/$/, "");
  }

  const base = String(siteUrl ?? "").trim().replace(/\/$/, "");
  const candidate = `${base}${MOLLIE_WEBHOOK_PATH}`;
  return isPubliclyReachableUrl(candidate) ? candidate : null;
}
