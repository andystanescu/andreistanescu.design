import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { recordAnalyticsEvent, recordUniqueView, visitorContextFromHeaders, type AnalyticsContentType } from "@/lib/analytics";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

const VISITOR_COOKIE_NAME = "conscept_visitor_id";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { eventType?: "view" | "share"; contentType?: AnalyticsContentType; contentId?: string; source?: string };
    if (!body.eventType || !body.contentType || !body.contentId || !["article", "case_study"].includes(body.contentType)) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    if (body.eventType === "share") {
      recordAnalyticsEvent("share", body.contentType, body.contentId);
      return NextResponse.json({ ok: true });
    }
    if (verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value)) {
      return NextResponse.json({ ok: true, counted: false });
    }
    const visitorId = request.cookies.get(VISITOR_COOKIE_NAME)?.value || randomUUID();
    const context = visitorContextFromHeaders(request.headers);
    if (["Direct", "Google", "LinkedIn", "Other sources"].includes(body.source || "")) context.source = body.source;
    const counted = recordUniqueView(body.contentType as "article" | "case_study", body.contentId, visitorId, context);
    const response = NextResponse.json({ ok: true, counted });
    if (!request.cookies.has(VISITOR_COOKIE_NAME)) response.cookies.set(VISITOR_COOKIE_NAME, visitorId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365, path: "/" });
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
