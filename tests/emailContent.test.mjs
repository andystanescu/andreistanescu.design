import test from "node:test";
import assert from "node:assert/strict";
import { contactEmailSubject, emailSiteName, recoveryEmailContent } from "../packages/core-domain/src/emailContent.ts";

test("contact and recovery emails use the configured site identity", () => {
  assert.equal(contactEmailSubject("Example Studio", "Alex"), "New message from Alex via Example Studio");
  const message = recoveryEmailContent("Example Studio", "https://example.test/reset");
  assert.equal(message.subject, "Reset your Example Studio admin access");
  assert.match(message.text, /Example Studio admin credentials/);
  assert.match(message.text, /https:\/\/example\.test\/reset/);
});

test("email subjects remove line breaks and have a neutral fallback", () => {
  assert.equal(emailSiteName(" \r\n "), "your site");
  assert.equal(contactEmailSubject("Site\r\nInjected", "Name\nInjected"), "New message from Name Injected via Site Injected");
});
