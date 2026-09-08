import { NextResponse } from "next/server";
import { recordAnalyticsEvent, type AnalyticsContentType } from "@/lib/analytics";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { eventType?: "share"; contentType?: AnalyticsContentType; contentId?: string };
    if (body.eventType !== "share" || !body.contentType || !["article", "case_study"].includes(body.contentType)) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    recordAnalyticsEvent("share", body.contentType, body.contentId || "");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
