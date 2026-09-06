import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  parseBandaiCsv,
  inferRounds,
  normalizeBandaiId,
  BandaiCsvError,
} from "../src/lib/league/bandai-csv.ts";

const real = readFileSync(new URL("./fixtures/standing-2026-08.csv", import.meta.url), "utf8");

test("parse le vrai export Bandai (BOM, espaces d'en-tête, colonnes Memo / Deck URLs)", () => {
  const rows = parseBandaiCsv(real, 6);
  assert.equal(rows.length, 64);
  assert.deepEqual(rows[0], {
    placement: 1,
    bandaiMemberId: "0000477052",
    playerName: "Nicolooo",
    matchPoints: 18,
    omwPct: 61.1,
    oomwPct: 64.6,
    wins: 6,
    draws: 0,
    losses: 0,
    memo: undefined,
    deckUrls: undefined,
  });
  assert.equal(rows[3].playerName, "Tony Tony Whopper [BlackSmiths]");
  assert.equal(rows[33].playerName, "Alexis Saïdani");
  assert.equal(rows[63].bandaiMemberId, "0000672109");
  assert.deepEqual([rows[7].wins, rows[7].draws, rows[7].losses], [4, 0, 2]);
  assert.equal(rows[20].oomwPct, 59);
});

test("sans nombre de rondes, il est déduit du meilleur score", () => {
  const rows = parseBandaiCsv(real);
  assert.deepEqual([rows[63].wins, rows[63].losses], [0, 6]);
});

test("en-têtes mal encodés (NumÃ©ro) et séparateur ;", () => {
  const txt =
    "Classement;NumÃ©ro de membre;Nom du joueur;Points gagnÃ©s;OMW %;OOMW %\n1;0000111222;Test;9;60%;55%";
  const rows = parseBandaiCsv(txt, 3);
  assert.equal(rows[0].bandaiMemberId, "0000111222");
  assert.equal(rows[0].wins, 3);
  assert.equal(rows[0].omwPct, 60);
});

test("en-têtes anglais, colonnes dans un autre ordre, nom entre guillemets", () => {
  const txt =
    'Player Name,Standing,Membership Number,Win Points\n"Doe, John",2,42,6\nAlice,1,7,9';
  const rows = parseBandaiCsv(txt, 3);
  assert.equal(rows[0].playerName, "Alice");
  assert.equal(rows[1].playerName, "Doe, John");
  assert.equal(rows[1].bandaiMemberId, "42");
});

test("inferRounds = plafond(max / 3), minimum 1", () => {
  assert.equal(inferRounds([{ matchPoints: 18 }, { matchPoints: 15 }]), 6);
  assert.equal(inferRounds([{ matchPoints: 16 }]), 6);
  assert.equal(inferRounds([]), 1);
});

test("normalizeBandaiId garde les zéros de tête et retire tout sauf les chiffres", () => {
  assert.equal(normalizeBandaiId(" 0000 477 052 "), "0000477052");
  assert.equal(normalizeBandaiId(null), "");
});

test("fichier vide ou en-têtes inconnus → BandaiCsvError", () => {
  assert.throws(() => parseBandaiCsv(""), BandaiCsvError);
  assert.throws(() => parseBandaiCsv("a,b,c\n1,2,3"), BandaiCsvError);
});
