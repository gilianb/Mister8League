import { test } from "node:test";
import assert from "node:assert/strict";
import { frenchAuthError } from "../src/lib/auth/errors.ts";

test("délai anti-spam de Supabase traduit avec le nombre de secondes", () => {
  assert.equal(
    frenchAuthError("For security purposes, you can only request this after 42 seconds."),
    "Par sécurité, patientez 42 secondes avant de refaire une demande."
  );
  assert.match(frenchAuthError("you can only request this after 1 second"), /1 seconde avant/);
});

test("limite d'envoi d'e-mails", () => {
  assert.match(frenchAuthError("Email rate limit exceeded"), /Trop de demandes/);
});

test("nouveau mot de passe identique à l'ancien", () => {
  assert.equal(
    frenchAuthError("New password should be different from the old password."),
    "Le nouveau mot de passe doit être différent de l'ancien."
  );
});

test("lien expiré ou invalide", () => {
  assert.match(frenchAuthError("Email link is invalid or has expired"), /invalide ou a expiré/);
  assert.match(frenchAuthError("Token has expired or is invalid"), /invalide ou a expiré/);
});

test("message inconnu conservé tel quel", () => {
  assert.equal(frenchAuthError("Something odd"), "Something odd");
});
