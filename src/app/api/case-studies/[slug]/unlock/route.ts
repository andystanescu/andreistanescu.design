import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { caseStudyAccessCookieName, createCaseStudyAccessToken } from "@/lib/caseStudyAccess";

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  const study = db.prepare("SELECT password_required, password_hashes, published FROM case_studies WHERE slug = ?").get(slug) as { password_required: number; password_hashes: string; published: number } | undefined;
  if (!study || !study.published || !study.password_required) return NextResponse.redirect(new URL(`/work/${encodeURIComponent(slug)}`, request.url), 303);
  let hashes: string[] = [];
  try { const parsed = JSON.parse(study.password_hashes || "[]"); hashes = Array.isArray(parsed) ? parsed.map((value) => typeof value === "string" ? value : value && typeof value === "object" && typeof value.hash === "string" ? value.hash : null).filter((value): value is string => Boolean(value)) : []; } catch { hashes = []; }
  let valid = false;
  for (const hash of hashes) { if (await bcrypt.compare(password, hash)) { valid = true; break; } }
  if (!valid) {
    if (request.headers.get("x-card-unlock") === "1") return NextResponse.json({ error: "That password was not recognised." }, { status: 401 });
    return NextResponse.redirect(new URL(`/work/${encodeURIComponent(slug)}?accessError=1`, request.url), 303);
  }
  if (request.headers.get("x-card-unlock") === "1") return NextResponse.json({ unlocked: true, redirect: `/work/${encodeURIComponent(slug)}` });
  const response = NextResponse.redirect(new URL(`/work/${encodeURIComponent(slug)}`, request.url), 303);
  response.cookies.set(caseStudyAccessCookieName(slug), createCaseStudyAccessToken(slug, hashes), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 30, path: "/" });
  return response;
}
