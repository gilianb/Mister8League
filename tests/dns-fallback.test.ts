import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeAddresses, isResolvableName, installDnsFallback } from "../scripts/dns-fallback.mjs";

type ModuleDns = typeof import("node:dns");
type Adresse = { address: string; family: number };
type RappelLookup = (error: Error | null, adresses?: Adresse[] | string, family?: number) => void;
type RappelResolve = (error: Error | null, adresses?: string[]) => void;

/** Installe le repli sur un faux `node:dns` et rend l'objet observé. */
function installerSur<T extends object>(faux: T): T {
  installDnsFallback(faux as unknown as ModuleDns, faux as unknown as ModuleDns);
  return faux;
}

test("mergeAddresses : natif d'abord, DNS en secours, sans doublon", () => {
  const natif = [{ address: "104.18.38.10", family: 4 }];
  const secours = [
    { address: "104.18.38.10", family: 4 },
    { address: "172.64.149.246", family: 4 },
  ];
  assert.deepEqual(mergeAddresses(natif, secours), [
    { address: "104.18.38.10", family: 4 },
    { address: "172.64.149.246", family: 4 },
  ]);
});

test("mergeAddresses : listes vides ou absentes", () => {
  assert.deepEqual(mergeAddresses([], []), []);
  assert.deepEqual(mergeAddresses(undefined, undefined), []);
  assert.deepEqual(mergeAddresses([], [{ address: "::1", family: 6 }]), [
    { address: "::1", family: 6 },
  ]);
});

test("isResolvableName : seuls les noms DNS méritent une requête", () => {
  assert.equal(isResolvableName("exemple.supabase.co"), true);
  assert.equal(isResolvableName("localhost"), false);
  assert.equal(isResolvableName("127.0.0.1"), false);
  assert.equal(isResolvableName("::1"), false);
  assert.equal(isResolvableName("[::1]"), false);
  assert.equal(isResolvableName(""), false);
});

test("installDnsFallback : complète l'adresse native avec celles du DNS", async () => {
  const faux = installerSur({
    lookup(_hostname: string, options: unknown, callback?: RappelLookup) {
      const done = (typeof options === "function" ? options : callback) as RappelLookup;
      done(null, [{ address: "104.18.38.10", family: 4 }]);
    },
    resolve4(_hostname: string, callback: RappelResolve) {
      callback(null, ["104.18.38.10", "172.64.149.246"]);
    },
    resolve6(_hostname: string, callback: RappelResolve) {
      callback(new Error("ENODATA"));
    },
  });

  const adresses = await new Promise((resolve, reject) =>
    faux.lookup("exemple.supabase.co", { all: true }, (e, a) => (e ? reject(e) : resolve(a)))
  );
  assert.deepEqual(adresses, [
    { address: "104.18.38.10", family: 4 },
    { address: "172.64.149.246", family: 4 },
  ]);
});

test("installDnsFallback : idempotent, et transparent hors du mode `all`", async () => {
  let appels = 0;
  const faux = installerSur({
    lookup(_hostname: string, options: unknown, callback?: RappelLookup) {
      appels += 1;
      const done = (typeof options === "function" ? options : callback) as RappelLookup;
      done(null, "104.18.38.10", 4);
    },
    resolve4(_hostname: string, callback: RappelResolve) {
      callback(null, ["172.64.149.246"]);
    },
    resolve6(_hostname: string, callback: RappelResolve) {
      callback(new Error("ENODATA"));
    },
  });

  const premier = faux.lookup;
  installerSur(faux);
  assert.equal(faux.lookup, premier, "installation répétée : pas d'empilement");

  const valeur = await new Promise((resolve) =>
    faux.lookup("exemple.supabase.co", {}, (_e, a) => resolve(a))
  );
  assert.equal(valeur, "104.18.38.10");
  assert.equal(appels, 1, "aucune requête DNS superflue hors du mode `all`");
});

test("installDnsFallback : un nom local ne déclenche aucune requête DNS", async () => {
  let resolutions = 0;
  const compter = (_hostname: string, callback: RappelResolve) => {
    resolutions += 1;
    callback(null, []);
  };
  const faux = installerSur({
    lookup(_hostname: string, options: unknown, callback?: RappelLookup) {
      const done = (typeof options === "function" ? options : callback) as RappelLookup;
      done(null, [{ address: "127.0.0.1", family: 4 }]);
    },
    resolve4: compter,
    resolve6: compter,
  });

  await new Promise((resolve) => faux.lookup("localhost", { all: true }, () => resolve(null)));
  assert.equal(resolutions, 0);
});

test("installDnsFallback : sans adresse DNS, le résultat natif est conservé", async () => {
  const echouer = (_hostname: string, callback: RappelResolve) => callback(new Error("ESERVFAIL"));
  const faux = installerSur({
    lookup(_hostname: string, options: unknown, callback?: RappelLookup) {
      const done = (typeof options === "function" ? options : callback) as RappelLookup;
      done(null, [{ address: "203.0.113.7", family: 4 }]);
    },
    resolve4: echouer,
    resolve6: echouer,
  });

  const adresses = await new Promise((resolve) =>
    faux.lookup("interne.exemple.test", { all: true }, (_e, a) => resolve(a))
  );
  assert.deepEqual(adresses, [{ address: "203.0.113.7", family: 4 }]);
});
