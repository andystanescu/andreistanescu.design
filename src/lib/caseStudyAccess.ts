import { createHmac, timingSafeEqual } from "crypto";
import { getSessionSecret } from "@/lib/auth";

export function caseStudyAccessCookieName(slug: string) {
  return `conscept_case_access_${Buffer.from(slug).toString("base64url")}`;
}

function signature(slug: string, hashes: string[]) {
  return createHmac("sha256", getSessionSecret()).update(`${slug}:${hashes.join("|")}`).digest("base64url");
}

export function createCaseStudyAccessToken(slug: string, hashes: string[]) {
  return signature(slug, hashes);
}

export function verifyCaseStudyAccessToken(token: string | undefined, slug: string, hashes: string[]) {
  if (!token) return false;
  const expected = signature(slug, hashes);
  const actual = Buffer.from(token);
  const wanted = Buffer.from(expected);
  return actual.length === wanted.length && timingSafeEqual(actual, wanted);
}
