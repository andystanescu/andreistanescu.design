import { createHmac, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const SESSION_COOKIE_NAME = "conscept_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set — required for the admin panel. See .env.example."
    );
  }
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function createSessionToken(): string {
  const payload = JSON.stringify({ exp: Date.now() + SESSION_TTL_MS });
  const encoded = Buffer.from(payload).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return false;

  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export async function verifyCredentials(
  username: string,
  password: string
): Promise<boolean> {
  const stored = getStoredAdminCredentials();
  const expectedUsername = stored?.username ?? process.env.ADMIN_USERNAME;
  const expectedHash = stored?.hash ?? process.env.ADMIN_PASSWORD_HASH;
  if (!expectedUsername || !expectedHash) {
    throw new Error(
      "Create administrator credentials through setup or set ADMIN_USERNAME / ADMIN_PASSWORD_HASH. See .env.example."
    );
  }
  // Constant-time-ish: always run bcrypt even on a username mismatch, so a
  // wrong username doesn't return measurably faster than a wrong password.
  const passwordOk = await bcrypt.compare(password, expectedHash);
  return username === expectedUsername && passwordOk;
}

type StoredAdminCredentials = { username: string; hash: string };

export function getStoredAdminCredentials(): StoredAdminCredentials | null {
  const row = db
    .prepare("SELECT value FROM settings WHERE key = 'admin_credentials'")
    .get() as { value?: string } | undefined;
  if (!row?.value) return null;

  try {
    const value = JSON.parse(row.value) as Partial<StoredAdminCredentials>;
    return value.username && value.hash
      ? { username: value.username, hash: value.hash }
      : null;
  } catch {
    return null;
  }
}

export function hasAdminCredentials(): boolean {
  const stored = getStoredAdminCredentials();
  return Boolean(
    stored || (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD_HASH)
  );
}

export function saveAdminCredentials(username: string, hash: string): void {
  db.prepare(
    "INSERT INTO settings (key, value) VALUES ('admin_credentials', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(JSON.stringify({ username, hash }));
}
