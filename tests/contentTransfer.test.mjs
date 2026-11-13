import test from "node:test";
import assert from "node:assert/strict";
import { parseTransferSelection, settingTransferGroup, transferGroupSource, uploadFilenames } from "../src/lib/contentTransfer.ts";

test("accepts only supported content groups", () => {
  assert.deepEqual([...parseTransferSelection("insights,caseStudies,unknown")], ["insights", "caseStudies"]);
});

test("separates identity, navigation, page and general settings", () => {
  assert.equal(settingTransferGroup("theme_config"), "siteIdentity");
  assert.equal(settingTransferGroup("author_name"), "siteIdentity");
  assert.equal(settingTransferGroup("logo_color_mapping"), "siteIdentity");
  assert.equal(settingTransferGroup("navigation_style"), "navigation");
  assert.equal(settingTransferGroup("footer_message"), "navigation");
  assert.equal(settingTransferGroup("about_hero_image"), "pages");
  assert.equal(settingTransferGroup("contact_email_to"), "siteSettings");
});

test("finds images only within the selected content, including encoded galleries", () => {
  const payload = { insights: [{ body: '<img src="/uploads/article.png">' }], caseStudies: [{ body: '%2Fuploads%2Fcase.png' }] };
  assert.deepEqual([...uploadFilenames(transferGroupSource(payload, "insights"))], ["article.png"]);
  assert.deepEqual([...uploadFilenames(transferGroupSource(payload, "caseStudies"))], ["case.png"]);
});
