import { test } from "node:test";
import assert from "node:assert/strict";
import { parseBandaiCsv } from "../src/lib/league/bandai-csv.ts";
import { matchRows } from "../src/lib/league/matching.ts";

const CSV = "Classement,Numéro de membre,Nom du joueur,Points gagnés\n1,0001,Alice,9\n2,0002,Bob,6\n3,0003,Zed,3";

test("priorité joueur existant > inscrit > non résolu ; no-shows", () => {
  const rows = parseBandaiCsv(CSV, 3);
  const players = [{ id: "p1", bandaiMemberId: "0001", displayName: "Alice", profileId: null }];
  const regs = [
    { id: "r1", profileId: "u1", participantName: "Alice", bandaiMemberId: "0001", leaderId: "L1", deckId: null },
    { id: "r2", profileId: "u2", participantName: "Bob", bandaiMemberId: "0002", leaderId: null, deckId: "d2" },
    { id: "r9", profileId: "u9", participantName: "Absent", bandaiMemberId: "0009", leaderId: null, deckId: null },
  ];
  const { matches, noShows } = matchRows(rows, players, regs);
  assert.deepEqual(matches[0], {
    rowIndex: 0,
    resolution: "auto_player",
    playerId: "p1",
    registrationId: "r1",
    leaderId: "L1",
    deckId: null,
  });
  assert.deepEqual(matches[1], {
    rowIndex: 1,
    resolution: "auto_registration",
    playerId: null,
    registrationId: "r2",
    leaderId: null,
    deckId: "d2",
  });
  assert.equal(matches[2].resolution, "unresolved");
  assert.deepEqual(noShows.map((r) => r.id), ["r9"]);
});

test("un joueur lié à un profil retrouve son inscription même si le numéro Bandai diffère", () => {
  const rows = parseBandaiCsv(CSV, 3);
  const players = [{ id: "p1", bandaiMemberId: "0001", displayName: "Alice", profileId: "u1" }];
  const regs = [
    { id: "r1", profileId: "u1", participantName: "Alice", bandaiMemberId: "9999", leaderId: "L7", deckId: null },
  ];
  const { matches } = matchRows(rows, players, regs);
  assert.equal(matches[0].registrationId, "r1");
  assert.equal(matches[0].leaderId, "L7");
});

test("numéros avec espaces ou zéros différents sont comparés après normalisation", () => {
  const rows = parseBandaiCsv("Classement,Numéro de membre,Nom du joueur,Points gagnés\n1, 00 01 ,Alice,9", 3);
  const players = [{ id: "p1", bandaiMemberId: "0001", displayName: "Alice", profileId: null }];
  const { matches } = matchRows(rows, players, []);
  assert.equal(matches[0].playerId, "p1");
});
