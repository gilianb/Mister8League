// Construit le catalogue des leaders à partir de l'identification visuelle
// des cartes déposées dans DONNEES_LIGUE/leaders/leaders.
//
// Usage : node scripts/build-leaders-catalog.mjs <cards-raw.json>
// Produit :
//   - public/leaders/<CODE>.<ext>          (images renommées)
//   - src/lib/data/leaders.ts              (catalogue TypeScript)
//   - supabase/migrations/0003_leaders.sql (seed SQL)

import { readFileSync, writeFileSync, copyFileSync, mkdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const RAW_JSON = process.argv[2];
const SOURCE_DIR = "/Users/abderrahim/MISTER 8/DONNEES_LIGUE/leaders/leaders";
const PROJECT = fileURLToPath(new URL("..", import.meta.url));

if (!RAW_JSON) {
  console.error("Usage : node scripts/build-leaders-catalog.mjs <cards-raw.json>");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(RAW_JSON, "utf8"));

const leaders = raw.filter((c) => c.type === "LEADER" && c.code && c.name);
const skipped = raw.filter((c) => c.type !== "LEADER");

// --- Regroupement par code, vote majoritaire sur nom/couleurs/vie ---
const byCode = new Map();
for (const card of leaders) {
  const code = card.code.toUpperCase().trim();
  if (!byCode.has(code)) byCode.set(code, []);
  byCode.get(code).push(card);
}

function majority(values) {
  const counts = new Map();
  for (const v of values) {
    const k = JSON.stringify(v);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const [winner] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return JSON.parse(winner);
}

const conflicts = [];
const catalog = [];

for (const [code, cards] of byCode) {
  const name = majority(cards.map((c) => c.name));
  const colors = majority(cards.map((c) => c.colors ?? []));
  const life = majority(cards.map((c) => c.life ?? null));

  const distinctNames = new Set(cards.map((c) => c.name));
  if (distinctNames.size > 1) {
    conflicts.push(`${code} : noms divergents [${[...distinctNames].join(" / ")}] → « ${name} »`);
  }

  // Image : uniquement parmi les fichiers dont la lecture correspond au nom
  // majoritaire (évite qu'un code mal lu colle la mauvaise illustration),
  // la plus lourde = la mieux définie.
  const candidates = cards.filter((c) => c.name === name);
  const best = candidates
    .map((c) => {
      const p = join(SOURCE_DIR, c.file);
      let size = 0;
      try {
        size = statSync(p).size;
      } catch {
        /* fichier absent */
      }
      return { file: c.file, size };
    })
    .filter((c) => c.size > 0)
    .sort((a, b) => b.size - a.size)[0];

  if (!best) {
    conflicts.push(`${code} : aucune image exploitable`);
    continue;
  }

  const ext = extname(best.file).toLowerCase();
  const imageFile = `${code}${ext}`;
  copyFileSync(join(SOURCE_DIR, best.file), join(PROJECT, "public/leaders", imageFile));

  catalog.push({ code, name, colors, life, image: `/leaders/${imageFile}` });
}

catalog.sort((a, b) => a.code.localeCompare(b.code));

mkdirSync(join(PROJECT, "public/leaders"), { recursive: true });

// --- src/lib/data/leaders.ts ---
const ts = `// Catalogue des leaders One Piece Card Game.
// Généré par scripts/build-leaders-catalog.mjs — ne pas éditer à la main.

export type LeaderColor = "Rouge" | "Vert" | "Bleu" | "Violet" | "Noir" | "Jaune";

export type Leader = {
  code: string;
  name: string;
  colors: LeaderColor[];
  life: number | null;
  /** Chemin public du visuel de la carte */
  image: string;
};

export const LEADERS: Leader[] = ${JSON.stringify(catalog, null, 2)};

const byCode = new Map(LEADERS.map((l) => [l.code, l]));

export function getLeader(code: string | undefined | null): Leader | undefined {
  return code ? byCode.get(code.toUpperCase()) : undefined;
}
`;
writeFileSync(join(PROJECT, "src/lib/data/leaders.ts"), ts);

// --- supabase/migrations/0003_leaders.sql ---
const values = catalog
  .map((l) => {
    const colors = `array[${l.colors.map((c) => `'${c}'`).join(", ")}]::text[]`;
    const name = l.name.replace(/'/g, "''");
    return `  ('${l.code}', '${name}', ${colors}, '${l.image}')`;
  })
  .join(",\n");

const sql = `-- Leaders One Piece Card Game (généré par scripts/build-leaders-catalog.mjs)

insert into leaders (game_id, code, name, colors, image_url)
select g.id, v.code, v.name, v.colors, v.image_url
from games g
cross join (values
${values}
) as v(code, name, colors, image_url)
where g.slug = 'one-piece'
on conflict (game_id, code) do update
  set name = excluded.name, colors = excluded.colors, image_url = excluded.image_url;
`;
writeFileSync(join(PROJECT, "supabase/migrations/0003_leaders.sql"), sql);

// --- Rapport ---
console.log(`Leaders uniques   : ${catalog.length}`);
console.log(`Cartes non-leader : ${skipped.length} (${[...new Set(skipped.map((c) => c.type))].join(", ")})`);
console.log(`Entrées analysées : ${raw.length}`);
if (conflicts.length) {
  console.log(`\nConflits résolus :`);
  for (const c of conflicts) console.log(`  - ${c}`);
}
