import { test } from "node:test";
import assert from "node:assert/strict";
import { matchLeaderList, parseLeaderList, resolveLeader, type LeaderRef, type RowRef } from "../src/lib/league/leader-list.ts";

const LEADERS: LeaderRef[] = [
  { id: "enel15", code: "OP15-058", name: "Enel" },
  { id: "enel05", code: "OP05-098", name: "Enel" },
  { id: "mihawk14", code: "OP14-020", name: "Dracule Mihawk" },
  { id: "robin09", code: "OP09-062", name: "Nico Robin" },
  { id: "boa14", code: "OP14-041", name: "Boa Hancock" },
  { id: "boa07", code: "OP07-038", name: "Boa Hancock" },
  { id: "st30", code: "ST30-001", name: "Luffy & Ace" },
  { id: "bonney04", code: "EB04-001", name: "Jewelry Bonney" },
  { id: "teach09", code: "OP09-081", name: "Marshall.D.Teach" },
  { id: "sabo13", code: "OP13-004", name: "Sabo" },
  { id: "ace16", code: "OP16-001", name: "Portgas.D.Ace" },
  { id: "luffy11", code: "OP11-040", name: "Monkey.D.Luffy" },
  { id: "luffy15", code: "OP15-098", name: "Monkey.D.Luffy" },
  { id: "krieg15", code: "OP15-001", name: "Krieg" },
  { id: "foxy07", code: "OP07-059", name: "Foxy" },
  { id: "roger13", code: "OP13-003", name: "Gol.D.Roger" },
  { id: "kid10", code: "OP10-099", name: 'Eustass"Captain"Kid' },
];

const ROWS: RowRef[] = [
  { id: "r1", playerName: "Nicolooo", leaderId: null, resolution: "unresolved" },
  { id: "r2", playerName: "ARXAVI", leaderId: null, resolution: "unresolved" },
  { id: "r3", playerName: "Kem", leaderId: null, resolution: "unresolved" },
  { id: "r4", playerName: "Tony Tony Whopper [BlackSmiths]", leaderId: null, resolution: "unresolved" },
  { id: "r5", playerName: "Senex", leaderId: null, resolution: "auto_player" },
  { id: "r6", playerName: "Flint", leaderId: null, resolution: "unresolved" },
  { id: "r7", playerName: "Killianr", leaderId: null, resolution: "unresolved" },
  { id: "r8", playerName: "Malinc", leaderId: null, resolution: "unresolved" },
  { id: "r9", playerName: "Dramsouuu", leaderId: null, resolution: "unresolved" },
  { id: "r10", playerName: "Miken", leaderId: "boa14", resolution: "unresolved" },
  { id: "r11", playerName: "Ignoré", leaderId: null, resolution: "skip" },
  { id: "r12", playerName: "Yastor", leaderId: null, resolution: "unresolved" },
];

test("lecture de la liste : puces, lignes TXT, deux-points, parenthèses", () => {
  const entries = parseLeaderList("* Nicolo : Enel OP15\nTXT\n\n• Senex (antoine) : Mihawk OP14\n* Malinc Teach OP09\n");
  assert.equal(entries.length, 3);
  assert.deepEqual(entries[0], { line: 1, raw: "Nicolo : Enel OP15", playerName: "Nicolo", leaderText: "Enel OP15" });
  assert.equal(entries[1].playerName, "Senex (antoine)");
  assert.equal(entries[2].leaderText, null);
});

test("résolution d'un leader : alias, set, ambiguïté, set manquant", () => {
  assert.equal(resolveLeader("Ener OP15", LEADERS).status, "ok");
  assert.equal((resolveLeader("Ener OP15", LEADERS) as { leader: LeaderRef }).leader.id, "enel15");
  assert.equal((resolveLeader("Mohawk OP14", LEADERS) as { leader: LeaderRef }).leader.id, "mihawk14");
  assert.equal((resolveLeader("ST30 Ace et Luffy", LEADERS) as { leader: LeaderRef }).leader.id, "st30");
  assert.equal((resolveLeader("Luffy et Ace ST30", LEADERS) as { leader: LeaderRef }).leader.id, "st30");
  assert.equal((resolveLeader("Luffy OP 11", LEADERS) as { leader: LeaderRef }).leader.id, "luffy11");
  assert.equal((resolveLeader("luffy op15", LEADERS) as { leader: LeaderRef }).leader.id, "luffy15");
  assert.equal((resolveLeader("Robin OP09", LEADERS) as { leader: LeaderRef }).leader.id, "robin09");
  assert.equal((resolveLeader("Bonney EB04", LEADERS) as { leader: LeaderRef }).leader.id, "bonney04");
  assert.equal((resolveLeader("Teach OP09", LEADERS) as { leader: LeaderRef }).leader.id, "teach09");
  assert.equal((resolveLeader("Krieg op15", LEADERS) as { leader: LeaderRef }).leader.id, "krieg15");
  // Sans set et plusieurs cartes possibles : on ne devine pas
  assert.equal(resolveLeader("Boa Hancock", LEADERS).status, "ambiguous");
  // Sans set mais une seule carte : OK
  assert.equal((resolveLeader("Foxy", LEADERS) as { leader: LeaderRef }).leader.id, "foxy07");
  // Set absent du catalogue (OP17 pas encore ajouté)
  const op17 = resolveLeader("Luffy OP17", LEADERS);
  assert.equal(op17.status, "unknown");
  assert.match((op17 as { detail: string }).detail, /pas en OP17/);
});

test("attribution groupée sur une liste réelle", () => {
  const text = [
    "* Nicolo : Enel OP15",
    "TXT",
    "* Hony BlackSmiths : Ener OP15",
    "* Kem : Mihawk op14",
    "* Senex (antoine) : Mihawk OP14",
    "* Flint : ST30 Ace et Luffy",
    "* Killianr : Mohawk OP14",
    "* Malinc Teach OP09",
    "* Dramsouuu : Kaido OP17",
    "* Miken : Boa Hancock OP14",
    "* Yastor : Luffy OP 17",
    "* Inconnu : Sabo OP13",
  ].join("\n");

  const res = matchLeaderList(text, ROWS, LEADERS);
  const byRow = Object.fromEntries(res.assignments.map((a) => [a.rowId, a]));

  assert.equal(byRow.r1.leaderId, "enel15");
  assert.equal(byRow.r1.confidence, "fuzzy"); // Nicolo ↔ Nicolooo
  assert.equal(byRow.r4.leaderId, "enel15"); // Hony BlackSmiths ↔ Tony Tony Whopper [BlackSmiths]
  assert.equal(byRow.r3.leaderId, "mihawk14");
  assert.equal(byRow.r3.confidence, "exact");
  assert.equal(byRow.r5.leaderId, "mihawk14"); // Senex (antoine) ↔ Senex
  assert.equal(byRow.r6.leaderId, "st30");
  assert.equal(byRow.r7.leaderId, "mihawk14"); // Mohawk
  assert.equal(byRow.r8.leaderId, "teach09"); // ligne sans deux-points
  assert.equal(byRow.r9, undefined); // Kaido OP17 : catalogue à compléter
  assert.equal(byRow.r12, undefined); // Luffy OP17 : idem

  assert.equal(res.keptExisting, 1); // Miken avait déjà un leader, non écrasé
  const kinds = res.issues.map((i) => i.kind);
  assert.deepEqual(kinds.sort(), ["leader_unknown", "leader_unknown", "player_not_found"].sort());
  assert.ok(res.issues.some((i) => i.detail.includes("Inconnu")));
});

test("écrasement explicite et lignes ignorées", () => {
  const res = matchLeaderList("Miken : Boa Hancock OP14\nIgnoré : Sabo OP13", ROWS, LEADERS, { overwrite: true });
  assert.equal(res.assignments.length, 1);
  assert.equal(res.assignments[0].rowId, "r10");
  assert.equal(res.keptExisting, 0);
  // La ligne « skip » n'est jamais candidate
  assert.equal(res.issues[0].kind, "player_not_found");
});
