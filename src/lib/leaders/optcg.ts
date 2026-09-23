// Normalisation des cartes leader renvoyées par optcgapi.com.
// Module pur (sans import) : testé directement par node --test.

export const OPTCG_ENDPOINTS = ["https://optcgapi.com/api/allSetCards/", "https://optcgapi.com/api/allSTCards/"];

/** Champs utilisés d'une carte optcgapi (l'API en renvoie davantage). */
export type OptcgCard = {
  card_name: string;
  card_set_id: string;
  card_image_id: string;
  card_image: string;
  card_color: string | null;
  card_type: string;
  set_name?: string | null;
};

export type NormalizedLeader = {
  code: string;
  name: string;
  colors: string[];
  imageSourceUrl: string;
  setName: string | null;
};

const COLOR_FR: Record<string, string> = {
  Red: "Rouge",
  Green: "Vert",
  Blue: "Bleu",
  Purple: "Violet",
  Black: "Noir",
  Yellow: "Jaune",
};

const VARIANT = /\b(parallel|alternate art|spr|super leader|reprint)\b/i;

/** « Crocodile (062) (Parallel) » → « Crocodile » ; « Law - OP14-001 » → « Law ». */
export function cleanLeaderName(raw: string): string {
  let name = raw.trim();
  let previous = "";
  while (name !== previous) {
    previous = name;
    name = name
      .replace(/\s*\([^()]*\)\s*$/, "")
      .replace(/\s+-\s+[A-Z]{1,4}\d{0,2}-\d{3}\s*$/i, "")
      .trim();
  }
  return name || raw.trim();
}

export function translateColors(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[\s/]+/)
    .map((c) => COLOR_FR[c] ?? null)
    .filter((c): c is string => c !== null);
}

export function sameColors(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((c) => set.has(c));
}

/** Rang de préférence d'une impression : plus petit = impression de base. */
function printingRank(c: OptcgCard, code: string): [number, number, number] {
  return [c.card_image_id.toUpperCase() === code ? 0 : 1, VARIANT.test(c.card_name) ? 1 : 0, c.card_image_id.length];
}

function comparePrintings(a: OptcgCard, b: OptcgCard, code: string): number {
  const ra = printingRank(a, code);
  const rb = printingRank(b, code);
  return ra[0] - rb[0] || ra[1] - rb[1] || ra[2] - rb[2] || a.card_image_id.localeCompare(b.card_image_id);
}

/** Une entrée par code leader, impression de base, triée par code. */
export function normalizeLeaders(cards: OptcgCard[]): NormalizedLeader[] {
  const byCode = new Map<string, OptcgCard[]>();
  for (const c of cards) {
    if (c.card_type !== "Leader") continue;
    const code = (c.card_set_id ?? "").trim().toUpperCase();
    if (!code || !c.card_name || !c.card_image) continue;
    const list = byCode.get(code) ?? [];
    list.push(c);
    byCode.set(code, list);
  }

  const out: NormalizedLeader[] = [];
  for (const [code, list] of byCode) {
    const best = [...list].sort((a, b) => comparePrintings(a, b, code))[0];
    out.push({
      code,
      name: cleanLeaderName(best.card_name),
      colors: translateColors(best.card_color),
      imageSourceUrl: best.card_image,
      setName: best.set_name ?? null,
    });
  }
  return out.sort((a, b) => a.code.localeCompare(b.code));
}
