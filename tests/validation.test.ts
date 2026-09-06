import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validatePseudo,
  validateBandaiId,
  validatePassword,
  validateEmail,
  validateFullName,
} from "../src/lib/auth/validation.ts";
import { slugify } from "../src/lib/slug.ts";
import { formatEuros, eurosInputToCents } from "../src/lib/money.ts";

test("pseudo", () => {
  assert.ok(validatePseudo("ab"));
  assert.equal(validatePseudo("Luffy_92"), null);
  assert.ok(validatePseudo("pas d'espace"));
});

test("numéro Bandai", () => {
  assert.equal(validateBandaiId("477052"), null);
  assert.equal(validateBandaiId("0000 477 052"), null);
  assert.ok(validateBandaiId("12ab"));
  assert.ok(validateBandaiId(""));
});

test("mot de passe, e-mail, nom", () => {
  assert.ok(validatePassword("1234567"));
  assert.equal(validatePassword("12345678"), null);
  assert.equal(validateEmail("a@b.fr"), null);
  assert.ok(validateEmail("a@b"));
  assert.ok(validateFullName("A"));
  assert.equal(validateFullName("Monkey D. Luffy"), null);
});

test("slugify et monnaie", () => {
  assert.equal(slugify("Tournoi One Piece OP16 — Août 2026"), "tournoi-one-piece-op16-aout-2026");
  assert.equal(eurosInputToCents("35,50"), 3550);
  assert.equal(eurosInputToCents("x"), 0);
  assert.equal(formatEuros(3500).replace(/ | /g, " "), "35,00 €");
});
