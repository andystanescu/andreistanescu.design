import { test } from "node:test";
import assert from "node:assert/strict";
import { canonicalSectionLayout, getServiceSectionOrder, parseServiceSectionSettings, sectionLayout, sectionVisible } from "../src/lib/serviceSectionSettings.ts";

test("reordered sections retain their saved order and discard the removed transformation", () => {
  const settings = parseServiceSectionSettings(JSON.stringify({ order: ["evidence", "outcomes", "evidence", "transformation", "unknown"] }));
  const order = getServiceSectionOrder(settings, "product-architecture", false);
  assert.deepEqual(order.slice(0, 2), ["evidence", "outcomes"]);
  assert.equal(new Set(order).size, order.length);
  assert.equal(order.includes("transformation"), false);
  assert.equal(order.includes("work"), true);
});

test("duplicate legacy layouts resolve to their section-specific selection", () => {
  assert.equal(canonicalSectionLayout("outcomes", "product-architecture"), "design-systems");
  assert.equal(canonicalSectionLayout("work", "ai-enabled-design-operations"), "product-architecture");
  assert.equal(canonicalSectionLayout("recognition", "ai-enabled-design-operations"), "design-systems");
  assert.equal(canonicalSectionLayout("recognition", "product-architecture"), "design-systems");
});

test("legacy pages keep their original layouts and visible sections", () => {
  const settings = parseServiceSectionSettings("{}");
  for (const key of ["outcomes", "work", "recognition"]) assert.equal(sectionLayout(settings, key, "product-architecture"), "product-architecture");
  assert.equal(sectionVisible(settings, "approach", "product-architecture"), true);
  assert.equal(sectionVisible(settings, "outcomes", "custom"), false);
  assert.equal(sectionVisible(settings, "evidence", "custom"), true);
  assert.equal(sectionVisible(settings, "additionalContent", "custom"), true);
});

test("section layout, visibility and TSX persist independently", () => {
  const input = { layouts: { outcomes: "governance-scale", work: "design-systems", recognition: "collaboration-alignment" }, visibility: { outcomes: false, recognition: true }, approachCode: "function Approach() { return <section>Test</section>; }" };
  const settings = parseServiceSectionSettings(JSON.stringify(input));
  assert.equal(sectionLayout(settings, "outcomes", "product-architecture"), "governance-scale");
  assert.equal(sectionLayout(settings, "work", "product-architecture"), "design-systems");
  assert.equal(sectionLayout(settings, "recognition", "product-architecture"), "collaboration-alignment");
  assert.equal(sectionVisible(settings, "outcomes", "product-architecture"), false);
  assert.equal(sectionVisible(settings, "work", "product-architecture"), true);
  assert.equal(settings.approachCode, input.approachCode);
});

test("invalid settings do not hide or corrupt legacy sections", () => {
  const settings = parseServiceSectionSettings('{"layouts":{"work":"invalid"},"visibility":{"outcomes":"false"},"approachCode":123}');
  assert.equal(sectionLayout(settings, "work", "design-systems"), "design-systems");
  assert.equal(sectionVisible(settings, "outcomes", "design-systems"), true);
  assert.equal(settings.approachCode, "");
});
