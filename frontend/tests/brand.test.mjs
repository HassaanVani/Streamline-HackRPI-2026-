import test from "node:test";
import assert from "node:assert/strict";
import { readTheme, persistTheme, brandAssets } from "../src/brand.ts";
test("persisted and unavailable theme storage are safe", () => {
  assert.equal(readTheme({ getItem: () => "atc" }), "atc");
  assert.equal(readTheme({ getItem: () => "invalid" }), "clouds");
  assert.equal(
    readTheme({
      getItem: () => {
        throw Error("blocked");
      },
    }),
    "clouds",
  );
  assert.doesNotThrow(() =>
    persistTheme(
      {
        setItem: () => {
          throw Error("blocked");
        },
      },
      "atc",
    ),
  );
  assert.notEqual(brandAssets.clouds, brandAssets.atc);
});
