import test from "node:test";
import assert from "node:assert/strict";
import { comparisonCopy } from "../src/comparisonCopy.ts";
const c = {
  stable: true,
  meaningful: true,
  time_difference_s: 30,
  percent_difference: 1,
};
test("uncertain comparison never claims equality or improvement", () => {
  assert.equal(
    comparisonCopy({ ...c, stable: false, meaningful: false }).title,
    "Comparison is inconclusive",
  );
  assert.equal(
    comparisonCopy({ ...c, stable: false }).title,
    "Comparison is inconclusive",
  );
});
test("zero difference, small difference and subminute advantage stay distinct", () => {
  assert.equal(
    comparisonCopy({ ...c, meaningful: false, time_difference_s: 0 }).title,
    "Same modeled cruise time",
  );
  assert.equal(
    comparisonCopy({ ...c, meaningful: false }).title,
    "Small modeled difference",
  );
  assert.equal(comparisonCopy(c).title, "About 30 sec less");
  assert.equal(
    comparisonCopy({ ...c, time_difference_s: 300 }).title,
    "About 5 min less",
  );
});
