import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { REGISTRANT_PROFILE } from "../src/lib/db/embeds.ts";

// ------------------------------------------------------------------
// `registrations` porte deux clés étrangères vers `profiles` (`profile_id` et
// `checked_in_by`). Un embed `profiles(...)` nu y est ambigu : PostgREST
// répond PGRST201 et la requête ENTIÈRE échoue — pas seulement la jointure.
// Comme la plupart des appels ignorent leur `error`, cela se traduit par une
// liste vide plutôt que par une erreur : « 0 inscrit » sur un tournoi plein.
// Ce test empêche le motif de revenir.
// ------------------------------------------------------------------

const RACINE = path.join(import.meta.dirname, "..", "src");

function sourcesTypeScript(): string[] {
  return fs
    .readdirSync(RACINE, { recursive: true, encoding: "utf8" })
    .filter((f) => /[.]tsx?$/.test(f))
    .map((f) => path.join(RACINE, f));
}

/**
 * Tables sous lesquelles un embed `profiles(...)` nu apparaît.
 *
 * Un select PostgREST imbrique les embeds : `a:t1(x, b:t2(y))`. On suit la
 * profondeur des parenthèses pour savoir quelle table englobe chaque embed —
 * `players(profile:profiles(...))` est sans ambiguïté, `registrations(...)` non.
 */
export function tablesParentesDeProfiles(select: string, tableRacine: string): string[] {
  const parents: string[] = [];
  const pile: string[] = [tableRacine];
  let motCourant = "";

  for (const c of select) {
    if (c === "(") {
      // `alias:table(` ou `table(` — l'alias précède le deux-points.
      const table = motCourant.split(":").pop()!.trim();
      if (table === "profiles") parents.push(pile[pile.length - 1]);
      pile.push(table);
      motCourant = "";
    } else if (c === ")") {
      pile.pop();
      motCourant = "";
    } else if (c === "," || c === " ") {
      motCourant = "";
    } else {
      motCourant += c;
    }
  }
  return parents;
}

test("REGISTRANT_PROFILE nomme la clé étrangère de l'inscrit", () => {
  assert.equal(REGISTRANT_PROFILE, "profiles!registrations_profile_id_fkey");
});

test("tablesParentesDeProfiles : suit l'imbrication des embeds", () => {
  assert.deepEqual(tablesParentesDeProfiles("id, profile:profiles(pseudo)", "registrations"), [
    "registrations",
  ]);
  // L'embed est sous `players`, pas sous la table racine.
  assert.deepEqual(
    tablesParentesDeProfiles("*, player:players(id, profile:profiles(pseudo))", "result_import_rows"),
    ["players"]
  );
  // Deux embeds, deux parents différents.
  assert.deepEqual(
    tablesParentesDeProfiles(
      "*, player:players(profile:profiles(pseudo)), registration:registrations(profile:profiles(pseudo))",
      "result_import_rows"
    ),
    ["players", "registrations"]
  );
  // La forme nommée ne compte pas comme `profiles` : le mot porte la contrainte.
  assert.deepEqual(
    tablesParentesDeProfiles(`profile:${REGISTRANT_PROFILE}(pseudo)`, "registrations"),
    []
  );
});

test("aucun embed `profiles` ambigu dans une requête sur `registrations`", () => {
  const fautifs: string[] = [];

  for (const fichier of sourcesTypeScript()) {
    const source = fs.readFileSync(fichier, "utf8");

    for (const m of source.matchAll(/[.]select[(]\s*(["`])([\s\S]*?)\1/g)) {
      // La table interrogée est celle du `.from(...)` le plus proche en amont.
      const amont = source.slice(0, m.index);
      const froms = [...amont.matchAll(/[.]from[(]\s*["`]([a-z_]+)["`]/g)];
      const tableRacine = froms.length ? froms[froms.length - 1][1] : "";

      for (const parent of tablesParentesDeProfiles(m[2], tableRacine)) {
        if (parent !== "registrations") continue;
        const ligne = amont.split("\n").length;
        fautifs.push(`${path.relative(path.join(RACINE, ".."), fichier)}:${ligne}`);
      }
    }
  }

  assert.deepEqual(
    fautifs,
    [],
    `Embed \`profiles(...)\` ambigu sous \`registrations\` — utiliser REGISTRANT_PROFILE (@/lib/db/embeds) :\n  ${fautifs.join("\n  ")}`
  );
});
