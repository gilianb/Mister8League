import { test } from "node:test";
import assert from "node:assert/strict";
import { eventAvailability, isActiveRegistration, seatsLeft } from "../src/lib/tournaments/status.ts";

const NOW = Date.parse("2026-09-06T12:00:00Z");
const iso = (offsetHours: number) => new Date(NOW + offsetHours * 3_600_000).toISOString();

test("eventAvailability", () => {
  const base = { status: "published", starts_at: iso(48), registration_open_at: null, registration_close_at: null };
  assert.deepEqual(eventAvailability(base, NOW), { open: true, reason: null });
  assert.equal(eventAvailability({ ...base, status: "draft" }, NOW).reason, "draft");
  assert.equal(eventAvailability({ ...base, status: "cancelled" }, NOW).reason, "cancelled");
  assert.equal(eventAvailability({ ...base, starts_at: iso(-1) }, NOW).reason, "past");
  assert.equal(eventAvailability({ ...base, registration_open_at: iso(2) }, NOW).reason, "not_open_yet");
  assert.equal(eventAvailability({ ...base, registration_close_at: iso(-2) }, NOW).reason, "closed");
});

test("isActiveRegistration", () => {
  assert.equal(isActiveRegistration({ status: "paid", expires_at: null }, NOW), true);
  assert.equal(isActiveRegistration({ status: "checked_in", expires_at: null }, NOW), true);
  assert.equal(isActiveRegistration({ status: "pending_payment", expires_at: iso(0.2) }, NOW), true);
  assert.equal(isActiveRegistration({ status: "pending_payment", expires_at: iso(-0.2) }, NOW), false);
  assert.equal(isActiveRegistration({ status: "pending_payment", expires_at: null }, NOW), false);
  assert.equal(isActiveRegistration({ status: "cancelled", expires_at: iso(1) }, NOW), false);
});

test("seatsLeft", () => {
  assert.equal(seatsLeft(64, 10), 54);
  assert.equal(seatsLeft(64, 70), 0);
  assert.equal(seatsLeft(0, 10), Infinity);
});
