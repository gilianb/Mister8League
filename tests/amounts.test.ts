import { test } from "node:test";
import assert from "node:assert/strict";
import { computeTotals, centsToMollieValue, mollieValueToCents, safeCurrency } from "../src/lib/payments/amounts.ts";

test("computeTotals", () => {
  assert.deepEqual(computeTotals(3500, 500), { subtotalCents: 3500, feeCents: 175, totalCents: 3675 });
  assert.deepEqual(computeTotals(3500, 0), { subtotalCents: 3500, feeCents: 0, totalCents: 3500 });
  assert.deepEqual(computeTotals(0, 500), { subtotalCents: 0, feeCents: 0, totalCents: 0 });
});

test("conversion Mollie", () => {
  assert.equal(centsToMollieValue(3675), "36.75");
  assert.equal(centsToMollieValue(3500), "35.00");
  assert.equal(mollieValueToCents("36.75"), 3675);
  assert.equal(mollieValueToCents("abc"), null);
});

test("safeCurrency", () => {
  assert.equal(safeCurrency("eur"), "EUR");
  assert.equal(safeCurrency(""), "EUR");
  assert.equal(safeCurrency("EURO"), "EUR");
});
