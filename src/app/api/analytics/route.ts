import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { recordAnalyticsEvent, recordUniqueView, recordEngagementBatch, visitorContextFromHeaders, type AnalyticsContentType, type EngagementInputEvent } from "@/lib/analytics";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

const VISITOR_COOKIE_NAME = "conscept_visitor_id";

export async function POST(request: NextRequest) {
  try {
    if (verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value)) return NextResponse.json({ ok: true, counted: false });
    const rawBody = await request.text();
    if (rawBody.length > 40_000) return NextResponse.json({ error: "Request is too large" }, { status: 413 });
    const body = JSON.parse(rawBody) as { eventType?: "view" | "share"; contentType?: AnalyticsContentType; contentId?: string; source?: string; sessionId?: string; events?: EngagementInputEvent[] };
    if (body.sessionId && Array.isArray(body.events)) {
      if (body.events.length > 25) return NextResponse.json({ error: "Too many events" }, { status: 413 });
      const accepted = recordEngagementBatch(body.sessionId, body.events, request.headers.get("user-agent") || "", body.source || "Direct");
      return NextResponse.json({ ok: accepted });
    }
    if (!body.eventType || !body.contentType || !body.contentId || !["article", "case_study"].includes(body.contentType)) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    if (body.eventType === "share") {
      recordAnalyticsEvent("share", body.contentType, body.contentId);
      return NextResponse.json({ ok: true });
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
