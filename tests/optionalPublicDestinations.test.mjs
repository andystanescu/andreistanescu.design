import test from "node:test";
import assert from "node:assert/strict";
import { homepageDestinationAvailable } from "../src/lib/features.ts";

test("homepage links respect independently disabled Services and Insights", () => {
  const services = process.env.SERVICES_ADDON_ENABLED;
  const insights = process.env.INSIGHTS_ADDON_ENABLED;
  try {
    process.env.SERVICES_ADDON_ENABLED = "false";
    process.env.INSIGHTS_ADDON_ENABLED = "true";
    for (const href of ["/services", "/services/design?from=home", "#services", "/#services"]) assert.equal(homepageDestinationAvailable(href), false, href);
    for (const href of ["/work", "/services-other", "/insights", "https://example.com/services"]) assert.equal(homepageDestinationAvailable(href), true, href);
    process.env.SERVICES_ADDON_ENABLED = "true";
    process.env.INSIGHTS_ADDON_ENABLED = "false";
    assert.equal(homepageDestinationAvailable("/services"), true);
    assert.equal(homepageDestinationAvailable("/insights/article"), false);
  } finally {
    if (services === undefined) delete process.env.SERVICES_ADDON_ENABLED; else process.env.SERVICES_ADDON_ENABLED = services;
    if (insights === undefined) delete process.env.INSIGHTS_ADDON_ENABLED; else process.env.INSIGHTS_ADDON_ENABLED = insights;
  }
});
