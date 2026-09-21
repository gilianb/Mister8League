// ------------------------------------------------------------------
// Attribution groupée des leaders depuis une liste collée par
// l'organisateur, du type :
//
//   * Nicolo : Enel OP15
//   * Senex (antoine) : Mihawk OP14
//   * Flint : ST30 Ace et Luffy
//   * Malinc Teach OP09            (sans deux-points : toléré)
//
// Deux rapprochements indépendants, tous deux tolérants :
//   - le pseudo de la liste ↔ le nom de la ligne du CSV Bandai
//     (« Nicolo » ↔ « Nicolooo », « Hony BlackSmiths » ↔ « Tony Tony
//     Whopper [BlackSmiths] »), chaque ligne ne pouvant être prise qu'une fois ;
//   - le leader écrit à la main ↔ le catalogue (« Ener OP15 » → Enel OP15-058,
//     « Mohawk OP14 » → Dracule Mihawk OP14-020).
//
// Module pur, testé par tests/leader-list.test.ts.
// ------------------------------------------------------------------

export type LeaderRef = { id: string; code: string | null; name: string };
export type RowRef = { id: string; playerName: string; leaderId: string | null; resolution: string };

export type ListEntry = {
  line: number;
  raw: string;
  playerName: string;
  /** Texte décrivant le leader, set compris (null si la ligne n'a pas de « : ») */
  leaderText: string | null;
};

export type Assignment = {
  rowId: string;
  rowName: string;
  entryName: string;
  leaderId: string;
  leaderLabel: string;
  confidence: "exact" | "fuzzy";
};

export type Issue = {
  line: number;
  raw: string;
  kind: "player_not_found" | "player_ambiguous" | "leader_unknown" | "leader_ambiguous" | "leader_missing";
  detail: string;
};

export type MatchResult = {
  assignments: Assignment[];
  issues: Issue[];
  /** Lignes reconnues mais laissées telles quelles (leader déjà choisi, écrasement refusé) */
  keptExisting: number;
};

const BULLET = /^[\s*•⁃\-–—·]+/;
const SET_RE = /\b(OP|EB|ST|PRB)\s*-?\s*(\d{1,2})\b/i;

/** Surnoms et raccourcis usuels → nom du catalogue (formes normalisées). */
const ALIASES: Record<string, string> = {
  ener: "enel",
  mohawk: "dracule mihawk",
  mihawk: "dracule mihawk",
  hancock: "boa hancock",
  boa: "boa hancock",
  teach: "marshall d teach",
  blackbeard: "marshall d teach",
  "barbe noire": "marshall d teach",
  newgate: "edward newgate",
  whitebeard: "edward newgate",
  "barbe blanche": "edward newgate",
  roger: "gol d roger",
  robin: "nico robin",
  bonney: "jewelry bonney",
  ace: "portgas d ace",
  luffy: "monkey d luffy",
  kid: "eustass captain kid",
  katakuri: "charlotte katakuri",
  linlin: "charlotte linlin",
  "big mom": "charlotte linlin",
  pudding: "charlotte pudding",
  law: "trafalgar law",
  zoro: "roronoa zoro",
  doflamingo: "donquixote doflamingo",
  doffy: "donquixote doflamingo",
  rosinante: "donquixote rosinante",
  corazon: "donquixote rosinante",
  moria: "gecko moria",
  lucci: "rob lucci",
  chopper: "tony tony chopper",
  garp: "monkey d garp",
  dragon: "monkey d dragon",
  ivankov: "emporio ivankov",
  oden: "kouzuki oden",
  rayleigh: "silvers rayleigh",
  vivi: "nefeltari vivi",
  reiju: "vinsmoke reiju",
  hody: "hody jones",
  betty: "belo betty",
  caesar: "caesar clown",
  akainu: "sakazuki",
  aokiji: "kuzan",
  fujitora: "issho",
  kinemon: "kin emon",
  "ace luffy": "luffy ace",
  "luffy ace": "luffy ace",
  "ace newgate": "ace newgate",
  "newgate ace": "ace newgate",
  "zoro sanji": "roronoa zoro sanji",
  "sanji zoro": "roronoa zoro sanji",
  xebec: "rocks d xebec",
};

export function normalizeText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function compact(s: string): string {
  return normalizeText(s).replace(/\s+/g, "");
}

function normalizeSet(prefix: string, num: string): string {
  return `${prefix.toUpperCase()}${num.padStart(2, "0")}`;
}

// ---------- 1. Lecture de la liste ----------

export function parseLeaderList(text: string): ListEntry[] {
  const entries: ListEntry[] = [];
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  lines.forEach((rawLine, i) => {
    const raw = rawLine.replace(BULLET, "").trim();
    if (!raw || /^txt$/i.test(raw)) return;
    const colon = raw.indexOf(":");
    if (colon > 0) {
      const playerName = raw.slice(0, colon).trim();
      const leaderText = raw.slice(colon + 1).trim();
      if (playerName) entries.push({ line: i + 1, raw, playerName, leaderText: leaderText || null });
    } else {
      entries.push({ line: i + 1, raw, playerName: raw, leaderText: null });
    }
  });
  return entries;
}

// ---------- 2. Leader écrit à la main → catalogue ----------

type LeaderLookup = { leader: LeaderRef; norm: string; set: string | null };

function indexLeaders(leaders: LeaderRef[]): LeaderLookup[] {
  return leaders.map((leader) => {
    const set = leader.code ? leader.code.split("-")[0].toUpperCase() : null;
    return { leader, norm: normalizeText(leader.name), set };
  });
}

function applyAliases(query: string): string {
  let q = normalizeText(query.replace(/\bet\b|&/gi, " "));
  if (ALIASES[q]) return ALIASES[q];
  const words = q.split(" ").map((w) => ALIASES[w] ?? w);
  q = words.join(" ");
  return ALIASES[q] ?? q;
}

export type LeaderResolution =
  | { status: "ok"; leader: LeaderRef }
  | { status: "unknown"; detail: string }
  | { status: "ambiguous"; detail: string };

export function resolveLeader(leaderText: string, leaders: LeaderRef[]): LeaderResolution {
  const index = indexLeaders(leaders);
  const setMatch = leaderText.match(SET_RE);
  const set = setMatch ? normalizeSet(setMatch[1], setMatch[2]) : null;
  const nameQuery = applyAliases(setMatch ? leaderText.replace(SET_RE, " ") : leaderText);
  if (!nameQuery) return { status: "unknown", detail: "aucun nom de leader" };

  const qTokens = nameQuery.split(" ");
  const nameMatches = index.filter(({ norm }) => {
    if (norm === nameQuery) return true;
    const nTokens = norm.split(" ");
    const allQueryInName = qTokens.every((t) => nTokens.includes(t));
    const allNameInQuery = nTokens.every((t) => qTokens.includes(t));
    return allQueryInName || allNameInQuery;
  });

  if (nameMatches.length === 0) {
    return { status: "unknown", detail: `« ${leaderText.trim()} » : leader inconnu du catalogue` };
  }

  const inSet = set ? nameMatches.filter((m) => m.set === set) : nameMatches;
  if (inSet.length === 0) {
    return {
      status: "unknown",
      detail: `« ${leaderText.trim()} » : ${nameMatches[0].leader.name} existe mais pas en ${set} (catalogue à compléter)`,
    };
  }

  // Plusieurs codes possibles : on ne devine pas.
  const codes = [...new Set(inSet.map((m) => m.leader.code ?? m.leader.name))];
  if (codes.length > 1) {
    return {
      status: "ambiguous",
      detail: `« ${leaderText.trim()} » : précisez le set (${codes.join(", ")})`,
    };
  }
  return { status: "ok", leader: inSet[0].leader };
}

/** Pour une ligne sans « : », retrouve le leader mentionné dans le texte. */
function splitWithoutColon(raw: string, leaders: LeaderRef[]): { playerName: string; leaderText: string } | null {
  const setMatch = raw.match(SET_RE);
  const setText = setMatch ? setMatch[0] : "";
  const body = setMatch ? raw.replace(SET_RE, " ") : raw;
  const words = body.trim().split(/\s+/);
  // On cherche le plus long suffixe de mots qui désigne un leader connu.
  for (let start = 1; start < words.length; start++) {
    const candidate = words.slice(start).join(" ");
    const res = resolveLeader(`${candidate} ${setText}`, leaders);
    if (res.status === "ok") {
      return { playerName: words.slice(0, start).join(" "), leaderText: `${candidate} ${setText}`.trim() };
    }
  }
  return null;
}

// ---------- 3. Pseudo de la liste → ligne du CSV ----------

function levenshtein(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let last = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, last + (a[i - 1] === b[j - 1] ? 0 : 1));
      last = tmp;
    }
  }
  return prev[b.length];
}

function stripParens(s: string): string {
  return s.replace(/\([^)]*\)|\[[^\]]*\]/g, " ");
}

/** Niveau de ressemblance : 0 = identique, plus c'est grand moins c'est sûr, Infinity = rien. */
function similarity(entryName: string, rowName: string): number {
  const e = compact(stripParens(entryName));
  const r = compact(rowName);
  if (!e || !r) return Infinity;
  if (e === r) return 0;
  if (e.length >= 4 && r.length >= 4 && (r.includes(e) || e.includes(r))) return 1;
  const eTokens = normalizeText(stripParens(entryName)).split(" ").filter((t) => t.length >= 4);
  const rTokens = normalizeText(rowName).split(" ");
  if (eTokens.some((t) => rTokens.includes(t))) return 2;
  const maxDist = e.length >= 8 ? 2 : e.length >= 5 ? 1 : 0;
  if (maxDist > 0 && levenshtein(e, r) <= maxDist) return 3;
  return Infinity;
}

// ---------- 4. Assemblage ----------

export function matchLeaderList(
  text: string,
  rows: RowRef[],
  leaders: LeaderRef[],
  options: { overwrite?: boolean } = {}
): MatchResult {
  const overwrite = options.overwrite ?? false;
  const entries = parseLeaderList(text);
  const assignments: Assignment[] = [];
  const issues: Issue[] = [];
  let keptExisting = 0;

  const candidates = rows.filter((r) => r.resolution !== "skip");
  const used = new Set<string>();

  for (const entry of entries) {
    let playerName = entry.playerName;
    let leaderText = entry.leaderText;
    if (!leaderText) {
      const split = splitWithoutColon(entry.raw, leaders);
      if (!split) {
        issues.push({ line: entry.line, raw: entry.raw, kind: "leader_missing", detail: "aucun leader lisible (attendu « Pseudo : Leader Set »)" });
        continue;
      }
      playerName = split.playerName;
      leaderText = split.leaderText;
    }

    // Ligne du CSV
    let best: { row: RowRef; score: number }[] = [];
    let bestScore = Infinity;
    for (const row of candidates) {
      if (used.has(row.id)) continue;
      const score = similarity(playerName, row.playerName);
      if (score < bestScore) {
        bestScore = score;
        best = [{ row, score }];
      } else if (score === bestScore && score !== Infinity) {
        best.push({ row, score });
      }
    }
    if (best.length === 0) {
      issues.push({ line: entry.line, raw: entry.raw, kind: "player_not_found", detail: `« ${playerName} » ne correspond à aucune ligne du CSV` });
      continue;
    }
    if (best.length > 1) {
      issues.push({
        line: entry.line,
        raw: entry.raw,
        kind: "player_ambiguous",
        detail: `« ${playerName} » ressemble à plusieurs lignes : ${best.map((b) => b.row.playerName).join(", ")}`,
      });
      continue;
    }
    const row = best[0].row;

    // Leader
    const leader = resolveLeader(leaderText, leaders);
    if (leader.status !== "ok") {
      issues.push({ line: entry.line, raw: entry.raw, kind: leader.status === "ambiguous" ? "leader_ambiguous" : "leader_unknown", detail: leader.detail });
      continue;
    }

    used.add(row.id);
    if (row.leaderId && !overwrite) {
      keptExisting += 1;
      continue;
    }
    assignments.push({
      rowId: row.id,
      rowName: row.playerName,
      entryName: playerName,
      leaderId: leader.leader.id,
      leaderLabel: `${leader.leader.name}${leader.leader.code ? ` (${leader.leader.code})` : ""}`,
      confidence: bestScore === 0 ? "exact" : "fuzzy",
    });
  }

  return { assignments, issues, keptExisting };
}
