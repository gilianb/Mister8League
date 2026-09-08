// ------------------------------------------------------------------
// Démarrage du serveur de développement sur le port déclaré par
// NEXT_PUBLIC_SITE_URL.
//
// Sans port explicite, `next dev` glisse silencieusement sur le port suivant
// quand 3000 est occupé (cf. `allowRetry` dans next/dist/cli/next-dev.js) :
// le site répond alors sur 3001 pendant que les retours Mollie, les liens des
// e-mails et le QR des billets pointent toujours sur 3000 — c'est-à-dire sur
// l'application qui occupe ce port. On épingle donc le port, et on échoue avec
// un message clair plutôt que de démarrer dans un état incohérent.
// ------------------------------------------------------------------

import { spawn } from "node:child_process";
import net from "node:net";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { devPortFromSiteUrl, parseEnvFile } from "./dev-port.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Priorités de Next : variable du shell, puis `.env.local`, puis `.env`. */
function readSiteUrl() {
  const fromShell = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromShell) return fromShell;
  for (const file of [".env.local", ".env"]) {
    const full = path.join(root, file);
    if (!fs.existsSync(full)) continue;
    const value = parseEnvFile(fs.readFileSync(full, "utf8")).NEXT_PUBLIC_SITE_URL;
    if (value) return value;
  }
  return "";
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net
      .createServer()
      .once("error", () => resolve(false))
      .once("listening", () => server.close(() => resolve(true)))
      // Sans hôte : même liaison que `next dev` (`::`, double pile), sinon un
      // serveur IPv6 déjà en place resterait invisible depuis 0.0.0.0 sous Windows.
      .listen(port);
  });
}

const siteUrl = readSiteUrl();
const sitePort = devPortFromSiteUrl(siteUrl);
const envPort = process.env.PORT ? Number(process.env.PORT) : null;
const port = envPort ?? sitePort;

if (envPort && sitePort && envPort !== sitePort) {
  console.warn(
    `\n  ⚠  PORT=${envPort} ne correspond pas à NEXT_PUBLIC_SITE_URL (port ${sitePort}).` +
      `\n     Les retours Mollie et les liens des e-mails pointeront sur le port ${sitePort}.\n`
  );
}

if (port !== null && !(await isPortFree(port))) {
  console.error(
    `\n  ✖  Le port ${port} est déjà utilisé par une autre application.\n` +
      `\n     Le site doit être servi sur ${siteUrl || `http://localhost:${port}`} : c'est cette adresse` +
      `\n     qui construit les retours de paiement Mollie, les liens des e-mails, le QR des` +
      `\n     billets et les redirections de connexion. Démarrer sur un autre port les casserait.\n` +
      `\n     Deux solutions :` +
      `\n       1. arrêter l'application qui occupe le port ${port}, puis relancer ;` +
      `\n       2. choisir un autre port pour la ligue : mettre par exemple` +
      `\n          NEXT_PUBLIC_SITE_URL=http://localhost:3001 dans .env.local.\n`
  );
  process.exit(1);
}

const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const args = ["dev", ...(port !== null ? ["-p", String(port)] : [])];

// Repli DNS multi-adresses (cf. scripts/dns-fallback.mjs). On passe par
// NODE_OPTIONS plutôt que par `--import` : Next sert les requêtes depuis des
// processus enfants, qui héritent de l'environnement mais pas des options de
// la ligne de commande.
const dnsFallback = pathToFileURL(path.join(root, "scripts", "dns-fallback-install.mjs")).href;
const nodeOptions = [process.env.NODE_OPTIONS, `--import ${dnsFallback}`].filter(Boolean).join(" ");

const child = spawn(process.execPath, [nextBin, ...args], {
  stdio: "inherit",
  cwd: root,
  env: { ...process.env, NODE_OPTIONS: nodeOptions },
});
child.on("exit", (code, signal) => process.exit(signal ? 1 : (code ?? 0)));
