import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// ------------------------------------------------------------------
// Les politiques RLS de lecture « own » laissent aussi passer les admins
// (`profile_id = auth.uid() or public.is_admin()`). Une fonction « My… » qui
// compte sur la RLS pour ne renvoyer que les lignes du joueur connecté renvoie
// donc celles de TOUT le monde dès que ce joueur est admin. Vécu : un second
// admin voyait « déjà inscrit » et le billet du premier sur le tournoi.
// Ce test exige un filtre explicite sur la colonne propriétaire.
// ------------------------------------------------------------------

const RACINE = path.join(import.meta.dirname, "..");
const SCHEMA = path.join(RACINE, "supabase", "migrations", "0001_schema.sql");

function sourcesTypeScript(): string[] {
  const src = path.join(RACINE, "src");
  return fs
    .readdirSync(src, { recursive: true, encoding: "utf8" })
    .filter((f) => /[.]tsx?$/.test(f))
    .map((f) => path.join(src, f));
}

/** Tables dont la lecture « own » s'ouvre aussi aux admins, avec leur colonne propriétaire. */
export function tablesOwnOuAdmin(sql: string): Map<string, string> {
  const tables = new Map<string, string>();
  for (const m of sql.matchAll(/create policy "[^"]+" on public[.](\w+) for select using [(]([^;]*)[)];/g)) {
    const proprietaire = m[2].match(/(\w+) = auth[.]uid[(][)]/);
    if (proprietaire && m[2].includes("public.is_admin()")) tables.set(m[1], proprietaire[1]);
  }
  return tables;
}

test("tablesOwnOuAdmin : lit les politiques du schéma", () => {
  const tables = tablesOwnOuAdmin(fs.readFileSync(SCHEMA, "utf8"));
  assert.equal(tables.get("registrations"), "profile_id");
  assert.equal(tables.get("decks"), "profile_id");
  assert.equal(tables.get("profiles"), "id");
  // Lecture publique élargie aux admins, mais sans notion de propriétaire.
  assert.equal(tables.has("events"), false);
});

test("chaque fonction « My… » filtre sur le joueur connecté", () => {
  const tables = tablesOwnOuAdmin(fs.readFileSync(SCHEMA, "utf8"));
  const fautifs: string[] = [];

  for (const fichier of sourcesTypeScript()) {
    const source = fs.readFileSync(fichier, "utf8");
    // Le corps s'arrête à la première accolade fermante en colonne 0.
    for (const fn of source.matchAll(/^export (?:async )?function (\w*My\w*)[(][\s\S]*?^}$/gm)) {
      for (const [, table] of fn[0].matchAll(/[.]from[(]\s*["`]([a-z_]+)["`]/g)) {
        const colonne = tables.get(table);
        if (colonne && !new RegExp(`[.]eq[(]\\s*["\`]${colonne}["\`]`).test(fn[0])) {
          fautifs.push(`${path.relative(RACINE, fichier)} ${fn[1]}() lit « ${table} » sans .eq("${colonne}", …)`);
        }
      }
    }
  }

  assert.deepEqual(fautifs, [], `Filtrer explicitement sur le joueur connecté :\n  ${fautifs.join("\n  ")}`);
});
