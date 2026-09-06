// ------------------------------------------------------------------
// Parseur de l'export CSV « Classement final » de Bandai TCG+.
//
// Colonnes attendues (interface FR ou EN, ordre libre, colonnes en plus
// tolérées, ex. « Memo », « Deck URLs ») :
//   Classement | Numéro de membre | Nom du joueur | Points gagnés | OMW % | OOMW %
//   Standing   | Membership Number| Player Name   | Win Points    | OMW % | OOMW %
//
// Les points gagnés valent 3 par victoire (1 par nul). Avec le nombre de
// rondes du tournoi, on en déduit le bilan V-N-D.
//
// Module pur (aucune dépendance Next) : testé par tests/bandai-csv.test.ts.
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
  memo?: string;
  deckUrls?: string;
};

export class BandaiCsvError extends Error {}

type ColumnKey = "placement" | "memberId" | "playerName" | "matchPoints" | "omw" | "oomw" | "memo" | "deckUrls";

/** Préfixes reconnus, après normalisation de l'en-tête (minuscules, sans accents ni ponctuation). */
const HEADER_PREFIXES: Record<ColumnKey, string[]> = {
  placement: ["classement", "standing", "rank", "place"],
  memberId: ["num", "membership", "member", "id"],
  playerName: ["nom", "player name", "name", "joueur", "pseudo"],
  matchPoints: ["points", "win points", "pts", "score"],
  omw: ["omw"],
  oomw: ["oomw"],
  memo: ["memo", "note"],
  deckUrls: ["deck"],
};

/**
 * Normalise un en-tête : minuscules, accents retirés, caractères mal
 * encodés (ex. « NumÃ©ro ») neutralisés, ponctuation supprimée.
 */
function normalizeHeader(h: string): string {
  return h
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9% ]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

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

function cleanText(value: string | undefined): string | undefined {
  const v = (value ?? "").trim();
  if (!v || v.toLowerCase() === "undefined" || v.toLowerCase() === "null") return undefined;
  return v;
}

/** Ne garde que les chiffres (zéros de tête conservés). */
export function normalizeBandaiId(raw: string | null | undefined): string {
  return String(raw ?? "").replace(/\D+/g, "");
}

/** Nombre de rondes déduit du meilleur score (3 points par victoire). */
export function inferRounds(rows: Array<{ matchPoints: number }>): number {
  const max = rows.reduce((m, r) => Math.max(m, r.matchPoints), 0);
  return Math.max(1, Math.ceil(max / 3));
}

/**
 * Parse le contenu texte d'un export Bandai TCG+.
 * @param rounds nombre de rondes du tournoi (pour déduire les défaites) ;
 *               déduit du meilleur score si absent.
 */
export function parseBandaiCsv(text: string, rounds?: number): BandaiRow[] {
  const clean = text
    .replace(/^﻿/, "")
    .replace(/^ï»¿/, "")
    .replace(/\r\n?/g, "\n");
  const lines = clean.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    throw new BandaiCsvError("Fichier vide ou sans lignes de résultats.");
  }

  const sep = lines[0].includes(";") ? ";" : ",";
  const header = splitLine(lines[0], sep).map(normalizeHeader);

  const findCol = (key: ColumnKey) =>
    header.findIndex((h) => HEADER_PREFIXES[key].some((p) => h === p || h.startsWith(p)));

  const idx = {
    placement: findCol("placement"),
    memberId: findCol("memberId"),
    playerName: findCol("playerName"),
    matchPoints: findCol("matchPoints"),
    omw: findCol("omw"),
    oomw: findCol("oomw"),
    memo: findCol("memo"),
    deckUrls: findCol("deckUrls"),
  };

  if (idx.placement < 0 || idx.memberId < 0 || idx.playerName < 0) {
    throw new BandaiCsvError(
      "En-têtes non reconnus. Attendu : Classement, Numéro de membre, Nom du joueur, Points gagnés, OMW %, OOMW %."
    );
  }

  const parsed: Array<Omit<BandaiRow, "wins" | "draws" | "losses">> = [];
  for (const line of lines.slice(1)) {
    const cells = splitLine(line, sep);
    const placement = parseNum(cells[idx.placement]);
    const playerName = cleanText(cells[idx.playerName]);
    if (!placement || !playerName) continue; // ligne décorative ou incomplète

    parsed.push({
      placement,
      bandaiMemberId: normalizeBandaiId(cells[idx.memberId]),
      playerName,
      matchPoints: idx.matchPoints >= 0 ? (parseNum(cells[idx.matchPoints]) ?? 0) : 0,
      omwPct: idx.omw >= 0 ? parseNum(cells[idx.omw]) : undefined,
      oomwPct: idx.oomw >= 0 ? parseNum(cells[idx.oomw]) : undefined,
      memo: idx.memo >= 0 ? cleanText(cells[idx.memo]) : undefined,
      deckUrls: idx.deckUrls >= 0 ? cleanText(cells[idx.deckUrls]) : undefined,
    });
  }

  if (parsed.length === 0) {
    throw new BandaiCsvError("Aucune ligne de résultat exploitable dans le fichier.");
  }

  const totalRounds = rounds && rounds > 0 ? rounds : inferRounds(parsed);

  const rows: BandaiRow[] = parsed.map((r) => {
    const wins = Math.floor(r.matchPoints / 3);
    const draws = r.matchPoints % 3;
    const losses = Math.max(0, totalRounds - wins - draws);
    return { ...r, wins, draws, losses };
  });

  return rows.sort((a, b) => a.placement - b.placement);
}
