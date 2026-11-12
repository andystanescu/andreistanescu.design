import { test } from "node:test";
import assert from "node:assert/strict";
import { getServiceSectionContent, parseServiceSectionOverrides } from "../src/lib/serviceSectionContent.ts";

test("evidence description and closing eyebrow persist independently", () => {
  const saved = parseServiceSectionOverrides(JSON.stringify({ "design-systems": { evidenceDescription: "Evidence copy", ctaEyebrow: "Get in touch" } }));
  const content = getServiceSectionContent("design-systems", saved);
  assert.equal(content.evidenceDescription, "Evidence copy");
  assert.equal(content.ctaEyebrow, "Get in touch");
});

test("service section edits round trip independently for each template", () => {
  const original = getServiceSectionContent("product-architecture", {});
  const outcomes = original.outcomes.map((item, index) => index === 0 ? { ...item, title: "A new outcome" } : item);
  const saved = parseServiceSectionOverrides(JSON.stringify({ "product-architecture": { outcomes, workTitle: "New work heading", workItems: original.workItems } }));
  assert.equal(getServiceSectionContent("product-architecture", saved).outcomes[0].title, "A new outcome");
  assert.equal(getServiceSectionContent("product-architecture", saved).workTitle, "New work heading");
  assert.equal(getServiceSectionContent("design-systems", saved).outcomes[0].title, "Consistency at scale");
});

test("malformed section data falls back to template defaults", () => {
  const saved = parseServiceSectionOverrides('{"product-architecture":{"outcomes":[{"title":"incomplete"}],"workItems":["one"]}}');
  assert.equal(getServiceSectionContent("product-architecture", saved).outcomes.length, 4);
  assert.equal(getServiceSectionContent("product-architecture", saved).workItems.length, 7);
  assert.deepEqual(parseServiceSectionOverrides("invalid json"), {});
});

test("recognition inputs retain their numbered positions and are isolated by template", () => {
  const templates = ["design-systems", "product-architecture", "ai-enabled-design-operations", "governance-scale", "collaboration-alignment"];
  for (const template of templates) {
    const defaults = getServiceSectionContent(template, {});
    assert.equal(defaults.recognitionSignals.length, 6);
    const signals = defaults.recognitionSignals.map((signal, index) => index === 2 ? "Custom third signal" : signal);
    const saved = parseServiceSectionOverrides(JSON.stringify({ [template]: { recognitionTitle: "Custom heading", recognitionSignals: signals } }));
    const result = getServiceSectionContent(template, saved);
    assert.equal(result.recognitionTitle, "Custom heading");
    assert.equal(result.recognitionSignals[2], "Custom third signal");
    assert.equal(result.recognitionSignals[3], defaults.recognitionSignals[3]);
    const another = templates.find((item) => item !== template);
    assert.deepEqual(getServiceSectionContent(another, saved).recognitionSignals, getServiceSectionContent(another, {}).recognitionSignals);
  }
  const invalid = parseServiceSectionOverrides('{"product-architecture":{"recognitionSignals":["only one"]}}');
  assert.equal(getServiceSectionContent("product-architecture", invalid).recognitionSignals.length, 6);
});
