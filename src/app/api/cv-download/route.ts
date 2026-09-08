import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";
import { recordAnalyticsEvent } from "@/lib/analytics";

export function GET(request: Request) {
  const cv = getSettings().about_cv;
  if (!cv) return new NextResponse("CV not available", { status: 404 });
  recordAnalyticsEvent("download", "cv");
  return NextResponse.redirect(new URL(cv, request.url));
}
