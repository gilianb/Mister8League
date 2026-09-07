// ------------------------------------------------------------------
// Port du serveur de développement. Module pur (testé dans tests/dev-port.test.ts).
//
// Le site doit être servi exactement à l'adresse NEXT_PUBLIC_SITE_URL : c'est
// elle qui construit les retours Mollie, les liens des e-mails, le QR des
// billets et les redirections d'authentification Supabase. Si le port réel
// diffère, ces liens pointent ailleurs (voire sur une autre application qui
// écoute le port) et échouent silencieusement.
// ------------------------------------------------------------------

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0", "::"]);

/**
 * Port à épingler pour `next dev`, ou `null` si NEXT_PUBLIC_SITE_URL ne décrit
 * pas un site local (site en production ou tunnel : on laisse Next choisir).
 * @param {string | undefined | null} siteUrl
 * @returns {number | null}
 */
export function devPortFromSiteUrl(siteUrl) {
  const raw = String(siteUrl ?? "").trim();
  if (!raw) return null;

  let url;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  // `new URL` conserve les crochets IPv6 : [::1] → "[::1]".
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!LOCAL_HOSTNAMES.has(host)) return null;

  if (url.port) return Number(url.port);
  return url.protocol === "https:" ? 443 : 80;
}

/**
 * Lecture minimale d'un fichier `.env` (suffisant pour NEXT_PUBLIC_SITE_URL ;
 * Next fait sa propre lecture, complète, au démarrage).
 * @param {string} text
 * @returns {Record<string, string>}
 */
export function parseEnvFile(text) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const line of String(text ?? "").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    const quoted =
      (value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"));
    if (quoted && value.length >= 2) value = value.slice(1, -1);
    out[key] = value;
  }
  return out;
}
