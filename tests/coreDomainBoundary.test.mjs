import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

test("the extracted domain package has no application or add-on dependencies", () => {
  const manifest = JSON.parse(readFileSync(new URL("../packages/core-domain/package.json", import.meta.url), "utf8"));
  assert.equal(manifest.private, true);
  assert.deepEqual(manifest.dependencies ?? {}, {});
  assert.deepEqual(manifest.files, ["dist", "README.md"]);
  const source = new URL("../packages/core-domain/src/", import.meta.url);
  const files = readdirSync(source).filter((name) => name.endsWith(".ts"));
  assert.ok(files.length);
  for (const name of files) {
    const contents = readFileSync(new URL(name, source), "utf8");
    assert.doesNotMatch(contents, /(?:from\s*|import\s*\()\s*["'](?:@\/|\.\.\/|next\/|react|node:)/, name);
    assert.doesNotMatch(contents, /andreistanescu|Andrei Stanescu/i, name);
  }
});
