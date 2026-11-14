import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { DESIGN_SYSTEM_FILES, DESIGN_SYSTEM_GROUPS, isDesignSystemSection } from "../src/lib/designSystemManifest.ts";

test("every library page has existing source files and a matching navigation entry", () => {
  const routes = DESIGN_SYSTEM_GROUPS.flatMap((group) => group.links.map(([, id]) => id));
  assert.deepEqual(new Set(routes), new Set(Object.keys(DESIGN_SYSTEM_FILES)));
  for (const route of routes) {
    assert.ok(isDesignSystemSection(route));
    for (const path of DESIGN_SYSTEM_FILES[route]) assert.ok(existsSync(path), `Missing source: ${path}`);
  }
  assert.equal(isDesignSystemSection("../../settings"), false);
});
