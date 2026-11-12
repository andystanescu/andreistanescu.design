import { test } from "node:test";
import assert from "node:assert/strict";
import { selectEvidence } from "../src/lib/evidenceSelection.ts";

const item = (type, id) => ({ type, href: `/${type}/${id}` });

test("empty and single-type pools are limited without duplicates", () => {
  assert.deepEqual(selectEvidence([]), []);
  const cases = Array.from({ length: 6 }, (_, i) => item("case-study", i));
  const result = selectEvidence([...cases, cases[0]], () => 0.5);
  assert.equal(result.length, 3);
  assert.equal(new Set(result.map((entry) => entry.href)).size, 3);
  assert.equal(selectEvidence(cases.slice(0, 2)).length, 2);
});

test("mixed pools include both types without repetition", () => {
  const pool = [item("case-study", 1), item("case-study", 2), item("article", 1), item("article", 2)];
  for (let i = 0; i < 100; i++) {
    const result = selectEvidence(pool);
    assert.equal(result.length, 3);
    assert.deepEqual(new Set(result.map((entry) => entry.type)), new Set(["case-study", "article"]));
    assert.equal(new Set(result.map((entry) => entry.href)).size, 3);
  }
});
