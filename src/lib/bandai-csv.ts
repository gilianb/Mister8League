// ------------------------------------------------------------------
// Parseur de l'export CSV « Classement final » de Bandai TCG+.
//
// Colonnes attendues (interface FR ou EN) :
//   Classement | Numéro de membre | Nom du joueur | Points gagnants | OMW % | OOMW %
//   Standing   | Membership Number| Player Name   | Win Points      | OMW % | OOMW %
//
// Les points gagnants valent 3 par victoire (1 par nul). Avec le
// nombre de rondes du tournoi, on en déduit le bilan V-N-D.
// ------------------------------------------------------------------

export type BandaiRow = {
  placement: number;
  bandaiMemberId: string;
  playerName: string;
  matchPoints: number;
  omwPct?: number;
  oomwPct?: number;
  wins: number;
  draws: number;
  losses: number;
};

export type PointRule = {
  label: string;
  placementMin: number;
  placementMax: number | null; // null = jusqu'au dernier
  points: number;
};

const HEADER_ALIASES: Record<keyof RawIndexes, string[]> = {
  placement: ["classement", "standing", "rank"],
  memberId: ["numéro de membre", "numero de membre", "membership number", "member number"],
  playerName: ["nom du joueur", "player name", "nom"],
  matchPoints: ["points gagnants", "win points", "points"],
  omw: ["omw %", "omw%", "omw"],
  oomw: ["oomw %", "oomw%", "oomw"],
};

type RawIndexes = {
  placement: number;
  memberId: number;
  playerName: number;
  matchPoints: number;
  omw: number;
  oomw: number;
};

/** Découpe une ligne CSV en gérant guillemets et séparateur , ou ; */
function splitLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === sep) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function parseNum(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = parseFloat(value.replace("%", "").replace(",", ".").trim());
  return Number.isFinite(n) ? n : undefined;
}

export class BandaiCsvError extends Error {}

/**
 * Parse le contenu texte d'un export Bandai TCG+.
 * @param rounds nombre de rondes du tournoi (pour déduire les défaites)
 */
export function parseBandaiCsv(text: string, rounds?: number): BandaiRow[] {
  const clean = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const lines = clean.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    throw new BandaiCsvError("Fichier vide ou sans lignes de résultats.");
  }

  const sep = lines[0].includes(";") ? ";" : ",";
  const header = splitLine(lines[0], sep).map((h) => h.toLowerCase());

  const findCol = (aliases: string[]) =>
    header.findIndex((h) => aliases.some((a) => h === a || h.startsWith(a)));

  const idx: RawIndexes = {
    placement: findCol(HEADER_ALIASES.placement),
    memberId: findCol(HEADER_ALIASES.memberId),
    playerName: findCol(HEADER_ALIASES.playerName),
    matchPoints: findCol(HEADER_ALIASES.matchPoints),
    omw: findCol(HEADER_ALIASES.omw),
    oomw: findCol(HEADER_ALIASES.oomw),
  };

  if (idx.placement < 0 || idx.memberId < 0 || idx.playerName < 0) {
    throw new BandaiCsvError(
      "En-têtes non reconnus. Attendu : Classement, Numéro de membre, Nom du joueur, Points gagnants, OMW %, OOMW %."
    );
  }

  const rows: BandaiRow[] = [];
  for (const line of lines.slice(1)) {
    const cells = splitLine(line, sep);
    const placement = parseNum(cells[idx.placement]);
    const playerName = cells[idx.playerName];
    if (!placement || !playerName) continue; // ligne décorative ou incomplète

    const matchPoints = parseNum(cells[idx.matchPoints]) ?? 0;
    const wins = Math.floor(matchPoints / 3);
    const draws = matchPoints % 3;
    const losses =
      rounds != null ? Math.max(0, rounds - wins - draws) : 0;

    rows.push({
      placement,
      bandaiMemberId: cells[idx.memberId],
      playerName,
      matchPoints,
      omwPct: idx.omw >= 0 ? parseNum(cells[idx.omw]) : undefined,
      oomwPct: idx.oomw >= 0 ? parseNum(cells[idx.oomw]) : undefined,
      wins,
      draws,
      losses,
    });
  }

  if (rows.length === 0) {
    throw new BandaiCsvError("Aucune ligne de résultat exploitable dans le fichier.");
  }
  return rows.sort((a, b) => a.placement - b.placement);
}

/**
 * Applique le barème de la saison à un placement.
 * Miroir de la fonction SQL compute_league_points : la règle la plus
 * spécifique (tranche la plus étroite) l'emporte.
 */
export function computeLeaguePoints(placement: number, rules: PointRule[]): number {
  const matching = rules
    .filter(
      (r) =>
        placement >= r.placementMin &&
        (r.placementMax == null || placement <= r.placementMax)
    )
    .sort(
      (a, b) =>
        (a.placementMax ?? Number.MAX_SAFE_INTEGER) -
        a.placementMin -
        ((b.placementMax ?? Number.MAX_SAFE_INTEGER) - b.placementMin)
    );
  return matching[0]?.points ?? 0;
}

/** Barème officiel de la ligue (identique au seed SQL). */
export const DEFAULT_SCALE: PointRule[] = [
  { label: "1er", placementMin: 1, placementMax: 1, points: 15 },
  { label: "2ème", placementMin: 2, placementMax: 2, points: 10 },
  { label: "Top 4", placementMin: 3, placementMax: 4, points: 8 },
  { label: "Top 8", placementMin: 5, placementMax: 8, points: 6 },
  { label: "Top 16", placementMin: 9, placementMax: 16, points: 4 },
  { label: "Top 32", placementMin: 17, placementMax: 32, points: 2 },
  { label: "Top 33-64", placementMin: 33, placementMax: 64, points: 1 },
];
