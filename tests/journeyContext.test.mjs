import test from "node:test";
import assert from "node:assert/strict";
import { displayJourneyCountry, journeyCountryFromHeaders, normalizeJourneyCountry, normalizeJourneySource } from "../src/lib/journeyContext.ts";

test("country accepts supported provider codes and ignores unavailable or malformed values", () => {
  assert.equal(journeyCountryFromHeaders(new Headers({ "cf-ipcountry": "xx", "x-vercel-ip-country": "gb" })), "GB");
  assert.equal(displayJourneyCountry("GB"), "United Kingdom");
  assert.equal(normalizeJourneyCountry("T1"), "");
  assert.equal(normalizeJourneyCountry("USA"), "");
  assert.equal(displayJourneyCountry(""), "Country unavailable");
  assert.equal(journeyCountryFromHeaders(new Headers()), "");
});

test("source retains named channels and hostnames without accepting full URLs", () => {
  assert.equal(normalizeJourneySource("LinkedIn"), "LinkedIn");
  assert.equal(normalizeJourneySource("Example.COM"), "example.com");
  assert.equal(normalizeJourneySource("https://example.com/private?email=x"), "Other sources");
  assert.equal(normalizeJourneySource("not a hostname"), "Other sources");
});
