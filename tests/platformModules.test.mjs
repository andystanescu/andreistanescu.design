import test from "node:test";
import assert from "node:assert/strict";
import { servicesAvailable, insightsAvailable } from "../src/lib/features.ts";

test("optional modules remain independent in every supported combination", () => {
  const previousServices = process.env.SERVICES_ADDON_ENABLED;
  const previousInsights = process.env.INSIGHTS_ADDON_ENABLED;
  try {
    for (const services of [false, true]) for (const insights of [false, true]) {
      process.env.SERVICES_ADDON_ENABLED = String(services);
      process.env.INSIGHTS_ADDON_ENABLED = String(insights);
      assert.equal(servicesAvailable(), services);
      assert.equal(insightsAvailable(), insights);
    }
    delete process.env.SERVICES_ADDON_ENABLED;
    delete process.env.INSIGHTS_ADDON_ENABLED;
    assert.equal(servicesAvailable(), true);
    assert.equal(insightsAvailable(), true);
    for (const value of ["0", " OFF ", "False"]) {
      process.env.SERVICES_ADDON_ENABLED = value;
      assert.equal(servicesAvailable(), false);
    }
  } finally {
    if (previousServices === undefined) delete process.env.SERVICES_ADDON_ENABLED; else process.env.SERVICES_ADDON_ENABLED = previousServices;
    if (previousInsights === undefined) delete process.env.INSIGHTS_ADDON_ENABLED; else process.env.INSIGHTS_ADDON_ENABLED = previousInsights;
  }
});
