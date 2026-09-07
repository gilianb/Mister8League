import { test } from "node:test";
import assert from "node:assert/strict";
import { devPortFromSiteUrl, parseEnvFile } from "../scripts/dev-port.mjs";

test("devPortFromSiteUrl : site local → port explicite", () => {
  assert.equal(devPortFromSiteUrl("http://localhost:3000"), 3000);
  assert.equal(devPortFromSiteUrl("http://localhost:3001/"), 3001);
  assert.equal(devPortFromSiteUrl("http://127.0.0.1:3002"), 3002);
  assert.equal(devPortFromSiteUrl("http://[::1]:3003"), 3003);
  assert.equal(devPortFromSiteUrl("https://localhost:8443"), 8443);
});

test("devPortFromSiteUrl : site local sans port → port du protocole", () => {
  assert.equal(devPortFromSiteUrl("http://localhost"), 80);
  assert.equal(devPortFromSiteUrl("https://localhost"), 443);
});

test("devPortFromSiteUrl : site public → null (on n'épingle pas)", () => {
  assert.equal(devPortFromSiteUrl("https://league.mister-8.com"), null);
  assert.equal(devPortFromSiteUrl("https://abc123.ngrok-free.app"), null);
});

test("devPortFromSiteUrl : valeur inutilisable → null", () => {
  assert.equal(devPortFromSiteUrl(""), null);
  assert.equal(devPortFromSiteUrl(undefined), null);
  assert.equal(devPortFromSiteUrl("pas-une-url"), null);
  assert.equal(devPortFromSiteUrl("ftp://localhost:3000"), null);
});

test("parseEnvFile : commentaires, guillemets, CRLF, = dans la valeur", () => {
  const env = parseEnvFile(
    [
      "# commentaire",
      "",
      "NEXT_PUBLIC_SITE_URL=http://localhost:3001",
      'EMAIL_FROM="Mister 8 <no-reply@mister-8.com>"',
      "SMTP_PASS='a=b=c'",
      "  SPACED  =  valeur  ",
      "SANS_EGAL",
    ].join("\r\n")
  );
  assert.equal(env.NEXT_PUBLIC_SITE_URL, "http://localhost:3001");
  assert.equal(env.EMAIL_FROM, "Mister 8 <no-reply@mister-8.com>");
  assert.equal(env.SMTP_PASS, "a=b=c");
  assert.equal(env.SPACED, "valeur");
  assert.equal(env.SANS_EGAL, undefined);
});
