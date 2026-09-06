import { test } from "node:test";
import assert from "node:assert/strict";
import { computeLeaguePoints, describeRule, type PointRule } from "../src/lib/league/points.ts";

const SCALE: PointRule[] = [
  { label: "1er", placementMin: 1, placementMax: 1, points: 15 },
  { label: "2ème", placementMin: 2, placementMax: 2, points: 10 },
  { label: "Top 4", placementMin: 3, placementMax: 4, points: 8 },
  { label: "Top 8", placementMin: 5, placementMax: 8, points: 6 },
  { label: "Top 16", placementMin: 9, placementMax: 16, points: 4 },
  { label: "Top 32", placementMin: 17, placementMax: 32, points: 2 },
  { label: "Top 33-64", placementMin: 33, placementMax: 64, points: 1 },
];

test("barème officiel", () => {
  assert.equal(computeLeaguePoints(1, SCALE), 15);
  assert.equal(computeLeaguePoints(4, SCALE), 8);
  assert.equal(computeLeaguePoints(9, SCALE), 4);
  assert.equal(computeLeaguePoints(20, SCALE), 2);
  assert.equal(computeLeaguePoints(40, SCALE), 1);
  assert.equal(computeLeaguePoints(70, SCALE), 0);
});

test("la tranche la plus étroite l'emporte en cas de recouvrement", () => {
  const rules: PointRule[] = [
    { label: "Participation", placementMin: 1, placementMax: null, points: 1 },
    { label: "Top 8", placementMin: 1, placementMax: 8, points: 6 },
    { label: "1er", placementMin: 1, placementMax: 1, points: 15 },
  ];
  assert.equal(computeLeaguePoints(1, rules), 15);
  assert.equal(computeLeaguePoints(5, rules), 6);
  assert.equal(computeLeaguePoints(120, rules), 1);
});

test("describeRule", () => {
  assert.equal(describeRule(SCALE[0]), "1er");
  assert.equal(describeRule(SCALE[2]), "3e à 4e");
  assert.equal(describeRule({ label: "x", placementMin: 65, placementMax: null, points: 0 }), "À partir du 65e");
});
