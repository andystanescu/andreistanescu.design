import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { basename, join } from "path";
import { getSettings } from "@/lib/settings";
import { recordAnalyticsEvent } from "@/lib/analytics";
import { getUploadsDir } from "@/lib/uploads";

export const dynamic = "force-dynamic";

export async function GET() {
  const cv = getSettings().about_cv;
  if (!cv) return new NextResponse("CV not available", { status: 404 });

  if (cv.startsWith("/uploads/")) {
    const filename = basename(cv);
    if (!filename || cv !== `/uploads/${filename}`) {
      return new NextResponse("CV not available", { status: 404 });
    }

    try {
      const content = await readFile(join(getUploadsDir(), filename));
      recordAnalyticsEvent("download", "cv");
      return new NextResponse(content, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="Andrei-Stanescu-CV.pdf"',
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch {
      return new NextResponse("CV not available", { status: 404 });
    }
  }

  if (!/^https?:\/\//i.test(cv)) {
    return new NextResponse("CV not available", { status: 404 });
  }

  recordAnalyticsEvent("download", "cv");
  return NextResponse.redirect(cv);
}
