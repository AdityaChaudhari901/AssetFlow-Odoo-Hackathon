import assert from "node:assert/strict";
import test from "node:test";

import {
  getThemeColor,
  isExplicitTheme,
  resolveTheme,
} from "../src/lib/theme.js";

test("isExplicitTheme accepts only supported manual themes", () => {
  assert.equal(isExplicitTheme("light"), true);
  assert.equal(isExplicitTheme("dark"), true);
  assert.equal(isExplicitTheme("system"), false);
  assert.equal(isExplicitTheme(null), false);
});

test("resolveTheme prefers a manual theme over the system theme", () => {
  assert.equal(resolveTheme("light", "dark"), "light");
  assert.equal(resolveTheme("dark", "light"), "dark");
});

test("resolveTheme follows the system theme without a manual override", () => {
  assert.equal(resolveTheme("system", "dark"), "dark");
  assert.equal(resolveTheme("system", "light"), "light");
  assert.equal(resolveTheme("unexpected", "unexpected"), "light");
});

test("getThemeColor returns the browser chrome color for each theme", () => {
  assert.equal(getThemeColor("light"), "#ffffff");
  assert.equal(getThemeColor("dark"), "#18161d");
});
