// ------------------------------------------------------------------
// Repli DNS multi-adresses pour le serveur de développement.
//
// Un hôte peut publier plusieurs adresses (Supabase est derrière Cloudflare et
// annonce deux IPv4). Sur certains réseaux, une partie de ces adresses est
// injectée dans un trou noir : les paquets partent, rien ne revient.
//
// `getaddrinfo` — donc `dns.lookup`, donc `net.connect`, donc `fetch` — ne
// rend souvent qu'UNE de ces adresses sous Windows. Si c'est la mauvaise, il
// n'y a aucune autre adresse à essayer : la connexion expire au bout de dix
// secondes (`UND_ERR_CONNECT_TIMEOUT`), et côté Supabase cela ressort en
// salves d'`AuthRetryableFetchError: fetch failed` à chaque requête.
//
// On complète donc le résultat de `dns.lookup` par une vraie requête DNS
// (`dns.resolve4` / `dns.resolve6`), qui rend toutes les adresses. Le
// « Happy Eyeballs » de Node (`autoSelectFamily`, actif par défaut) essaie
// alors la suivante après ~250 ms au lieu de rester bloqué sur une adresse
// morte.
//
// Le résultat natif reste en tête : le fichier `hosts` et les résolutions
// locales gardent la priorité, les adresses issues du DNS ne servent que de
// secours. Module réservé au développement (cf. scripts/dev.mjs).
// ------------------------------------------------------------------

import dns from "node:dns";
import net from "node:net";

const INSTALLED = Symbol.for("mister8.dnsFallbackInstalled");

/**
 * Adresses natives d'abord, adresses DNS ensuite, sans doublon.
 * @param {Array<{ address: string, family: number }> | undefined} native
 * @param {Array<{ address: string, family: number }> | undefined} extra
 * @returns {Array<{ address: string, family: number }>}
 */
export function mergeAddresses(native, extra) {
  /** @type {Array<{ address: string, family: number }>} */
  const out = [];
  const seen = new Set();
  for (const entry of [...(native ?? []), ...(extra ?? [])]) {
    if (!entry?.address || seen.has(entry.address)) continue;
    seen.add(entry.address);
    out.push(entry);
  }
  return out;
}

/**
 * Vrai si une requête DNS peut apporter des adresses supplémentaires.
 * Inutile pour une IP littérale ou un nom sans point (« localhost », NetBIOS,
 * mDNS) : ceux-là ne se résolvent que localement.
 * @param {string} hostname
 * @returns {boolean}
 */
export function isResolvableName(hostname) {
  const name = String(hostname ?? "");
  return name.includes(".") && !net.isIP(name.replace(/^\[|\]$/g, ""));
}

/** Résout toutes les adresses d'un hôte ; les échecs rendent une liste vide. */
function resolveAll(resolver, hostname, family, done) {
  const wanted = family === 4 || family === 6 ? [family] : [4, 6];
  const results = [];
  let pending = wanted.length;
  for (const version of wanted) {
    const resolve = version === 4 ? resolver.resolve4 : resolver.resolve6;
    resolve.call(resolver, hostname, (error, addresses) => {
      if (!error) {
        for (const address of addresses ?? []) results.push({ address, family: version });
      }
      if (--pending === 0) done(results);
    });
  }
}

/**
 * Installe le repli sur le module `node:dns`. Idempotent.
 * @param {typeof dns} [target] Module dont `lookup` est enveloppé.
 * @param {typeof dns} [resolver] Module fournissant `resolve4` / `resolve6`.
 */
export function installDnsFallback(target = dns, resolver = dns) {
  if (target.lookup?.[INSTALLED]) return;
  const native = target.lookup;

  /** @type {typeof dns.lookup} */
  const lookup = (hostname, options, callback) => {
    const done = typeof options === "function" ? options : callback;
    const opts = typeof options === "function" ? {} : (options ?? {});

    // Seul le mode `all` sert au repli : c'est celui que `net.connect` emploie
    // quand `autoSelectFamily` est actif. Sinon une seule adresse est attendue,
    // et il n'y a de toute façon rien vers quoi basculer.
    if (!opts.all || !isResolvableName(hostname)) {
      return native.call(target, hostname, options, callback);
    }

    native.call(target, hostname, opts, (nativeError, nativeAddresses) => {
      resolveAll(resolver, hostname, opts.family, (extra) => {
        const merged = mergeAddresses(nativeError ? [] : nativeAddresses, extra);
        if (merged.length === 0) return native.call(target, hostname, options, callback);
        done(null, merged);
      });
    });
  };

  lookup[INSTALLED] = true;
  target.lookup = lookup;
}
