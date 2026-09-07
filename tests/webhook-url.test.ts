import { test } from "node:test";
import assert from "node:assert/strict";
import { isPubliclyReachableUrl, resolveMollieWebhookUrl } from "../src/lib/payments/webhook-url.ts";

test("hôtes non joignables depuis Internet", () => {
  for (const url of [
    "http://localhost:3000/api/mollie/webhook",
    "http://LOCALHOST:3000/api/mollie/webhook",
    "http://app.localhost:3000/x",
    "http://127.0.0.1:3000/x",
    "http://0.0.0.0:3000/x",
    "http://[::1]:3000/x",
    "http://192.168.1.20:3000/x",
    "http://10.0.0.5/x",
    "http://172.16.4.2/x",
    "http://172.31.255.1/x",
    "http://169.254.1.1/x",
    "http://mac-de-gilian.local/x",
    "http://site.test/x",
    "ftp://example.com/x",
    "pas-une-url",
    "",
  ]) {
    assert.equal(isPubliclyReachableUrl(url), false, `devrait être rejeté : ${url}`);
  }
});

test("hôtes joignables depuis Internet", () => {
  for (const url of [
    "https://league.mister-8.com/api/mollie/webhook",
    "http://league.mister-8.com/api/mollie/webhook",
    "https://abc123.ngrok-free.app/api/mollie/webhook",
    "https://172.32.0.1/x", // hors plage privée 172.16–172.31
    "https://11.0.0.1/x",
  ]) {
    assert.equal(isPubliclyReachableUrl(url), true, `devrait être accepté : ${url}`);
  }
});

test("resolveMollieWebhookUrl : localhost → pas de webhook", () => {
  assert.equal(resolveMollieWebhookUrl("http://localhost:3000", undefined), null);
  assert.equal(resolveMollieWebhookUrl("http://localhost:3000", "  "), null);
});

test("resolveMollieWebhookUrl : site public → webhook du site", () => {
  assert.equal(
    resolveMollieWebhookUrl("https://league.mister-8.com", undefined),
    "https://league.mister-8.com/api/mollie/webhook"
  );
  assert.equal(
    resolveMollieWebhookUrl("https://league.mister-8.com/", undefined),
    "https://league.mister-8.com/api/mollie/webhook"
  );
});

test("resolveMollieWebhookUrl : surcharge tunnel prioritaire", () => {
  assert.equal(
    resolveMollieWebhookUrl("http://localhost:3000", "https://abc.ngrok-free.app/api/mollie/webhook"),
    "https://abc.ngrok-free.app/api/mollie/webhook"
  );
  // Surcharge donnée sans chemin : on complète avec la route du webhook.
  assert.equal(
    resolveMollieWebhookUrl("http://localhost:3000", "https://abc.ngrok-free.app"),
    "https://abc.ngrok-free.app/api/mollie/webhook"
  );
  // Surcharge elle-même injoignable : ignorée.
  assert.equal(resolveMollieWebhookUrl("http://localhost:3000", "http://127.0.0.1:3000/api/mollie/webhook"), null);
});
