import test from "node:test";
import assert from "node:assert/strict";
import { windSampler, buildWindFlow } from "../src/windFlow.ts";
const field = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 0, y: 100 },
  { x: 100, y: 100 },
].map((p) => ({ ...p, dx: 2, dy: 0, speed: 20 }));
test("constant wind interpolation preserves components and refuses extrapolation", () => {
  const sample = windSampler(field, 2);
  assert.deepEqual(sample(50, 50), { dx: 2, dy: 0, speed: 20 });
  assert.equal(sample(-1, 50), null);
});
test("streamlines follow wind direction and remain in sampled coverage", () => {
  const paths = buildWindFlow(field, 120, 120, 2);
  assert.ok(paths.length > 0);
  for (const path of paths)
    for (let i = 0; i < path.length; i++) {
      const p = path[i];
      assert.ok(p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100);
      if (i) {
        assert.ok(p.x > path[i - 1].x);
        assert.equal(p.y, path[i - 1].y);
      }
    }
  assert.equal(
    buildWindFlow(
      field.map((p) => ({ ...p, dx: 0, speed: 0 })),
      100,
      100,
      2,
    ).length,
    0,
  );
});
