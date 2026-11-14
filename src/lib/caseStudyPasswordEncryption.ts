import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

/** Encrypt revealable passwords separately from their bcrypt verification hash. */
export function encryptCaseStudyPassword(password: string, secret: string, studyId: string): string {
  const iv = randomBytes(12);
  const key = scryptSync(secret, "case-study-password-reveal-v1", 32);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(`case-study:${studyId}`));
  const encrypted = Buffer.concat([cipher.update(password, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptCaseStudyPassword(value: string, secret: string, studyId: string): string | null {
  try {
    const [version, iv, tag, ciphertext, extra] = value.split(".");
    if (version !== "v1" || !iv || !tag || !ciphertext || extra) return null;
    if ([iv, tag, ciphertext].some((part) => !/^[A-Za-z0-9_-]+$/.test(part) || Buffer.from(part, "base64url").toString("base64url") !== part)) return null;
    const decipher = createDecipheriv("aes-256-gcm", scryptSync(secret, "case-study-password-reveal-v1", 32), Buffer.from(iv, "base64url"));
    decipher.setAAD(Buffer.from(`case-study:${studyId}`));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64url")), decipher.final()]).toString("utf8");
  } catch { return null; }
}
