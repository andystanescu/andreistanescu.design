import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionSecret, SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { decryptCaseStudyPassword } from "@/lib/caseStudyPasswordEncryption";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const data = await request.json().catch(() => null) as { index?: unknown } | null;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(data?.index) || (data?.index as number) < 0) return NextResponse.json({ error: "Invalid password selection." }, { status: 400 });
  const study = db.prepare("SELECT password_hashes FROM case_studies WHERE id = ?").get(id) as { password_hashes: string } | undefined;
  if (!study) return NextResponse.json({ error: "Case study not found." }, { status: 404 });
  let encrypted = "";
  try { const entries: unknown = JSON.parse(study.password_hashes || "[]"); const entry = Array.isArray(entries) ? entries[data?.index as number] : null; encrypted = entry && typeof entry.encrypted === "string" ? entry.encrypted : ""; } catch { /* Invalid stored data cannot be revealed. */ }
  const password = encrypted ? decryptCaseStudyPassword(encrypted, getSessionSecret(), id) : null;
  if (password === null) return NextResponse.json({ error: "This password cannot be revealed. Replace it to create a revealable password." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ password }, { headers: { "Cache-Control": "no-store, private" } });
}
