import test from "node:test";
import assert from "node:assert/strict";
import { decryptCaseStudyPassword, encryptCaseStudyPassword } from "../src/lib/caseStudyPasswordEncryption.ts";

test("password encryption is randomized and bound to the case study and secret", () => {
  const first = encryptCaseStudyPassword("a test password", "example secret", "8");
  const second = encryptCaseStudyPassword("a test password", "example secret", "8");
  assert.notEqual(first, second);
  assert.equal(first.includes("a test password"), false);
  assert.equal(decryptCaseStudyPassword(first, "example secret", "8"), "a test password");
  assert.equal(decryptCaseStudyPassword(first, "wrong secret", "8"), null);
  assert.equal(decryptCaseStudyPassword(first, "example secret", "9"), null);
  assert.equal(decryptCaseStudyPassword(`${first}x`, "example secret", "8"), null);
});
