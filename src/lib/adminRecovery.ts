import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";

const RECOVERY_TTL_MS = 15 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createAdminRecoveryToken() {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + RECOVERY_TTL_MS;
  db.prepare("DELETE FROM admin_recovery_tokens WHERE used = 1 OR expires_at <= ?").run(Date.now());
  db.prepare("UPDATE admin_recovery_tokens SET used = 1 WHERE used = 0").run();
  db.prepare("INSERT INTO admin_recovery_tokens (token_hash, expires_at) VALUES (?, ?)").run(hashToken(token), expiresAt);
  return token;
}

export function consumeAdminRecoveryToken(token: string) {
  if (!token.trim()) return false;
  const result = db.prepare(
    "UPDATE admin_recovery_tokens SET used = 1 WHERE token_hash = ? AND used = 0 AND expires_at > ?"
  ).run(hashToken(token), Date.now());
  return Number(result.changes) === 1;
}
