import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { evaluateChallenge } from "../src/challenges.ts";
const read = (id) =>
  JSON.parse(
    readFileSync(
      new URL(`../public/examples/${id}.json`, import.meta.url),
      "utf8",
    ),
  );
const east = read("e317d34c50c6bb3faf06"),
  west = read("ebcf371d8f6710ed81c7"),
  calm = read("3a6c45190584b242dab7"),
  short = read("eee1f0266a834e74911b");
test("direction challenge scores actual same-time forecast durations", () => {
  const result = evaluateChallenge("reverse", west, east);
  assert.equal(result.answer, 0);
  assert.match(result.evidence, /82 minute/);
  const changed = structuredClone(west);
  changed.metrics.great_circle.modeled_duration_s =
    east.metrics.great_circle.modeled_duration_s - 120;
  assert.equal(evaluateChallenge("reverse", changed, east).answer, 1);
});
test("zero-wind and short-route answers derive from current saved metrics", () => {
  assert.equal(evaluateChallenge("calm", calm).answer, 2);
  assert.equal(evaluateChallenge("short", short).answer, 0);
  const changed = structuredClone(short);
  changed.metrics.wind_optimized.modeled_duration_s *= 0.97;
  assert.equal(evaluateChallenge("short", changed).answer, 1);
});
test("wrong journeys, mismatched times and unreliable grids cannot award a result", () => {
  assert.throws(() => evaluateChallenge("calm", east), /does not match/);
  const changed = structuredClone(east);
  changed.provenance.valid_time = "2030-01-01T00:00:00Z";
  assert.throws(() => evaluateChallenge("reverse", west, changed), /Matching/);
  const limited = structuredClone(short);
  limited.warnings.push("DOMAIN_BOUNDARY");
  assert.throws(() => evaluateChallenge("short", limited), /too sensitive/);
});
