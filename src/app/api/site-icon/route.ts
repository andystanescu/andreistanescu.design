import { readFile } from "fs/promises";
import { basename, extname, join } from "path";
import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";
import { getUploadsDir } from "@/lib/uploads";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const iconUrl = getSettings().logo_icon_image;
  const filename = basename(iconUrl);
  const extension = extname(filename).toLowerCase();

  // Only serve icon files created by the site's own upload flow.
  if (!iconUrl.startsWith("/uploads/") || !/^[\da-f-]+\.(png|svg)$/i.test(filename)) {
    return NextResponse.redirect(new URL("/favicon.ico", request.url), 307);
  }

  try {
    const image = await readFile(join(getUploadsDir(), filename));
    return new Response(new Uint8Array(image), {
      headers: {
        "Content-Type": extension === ".svg" ? "image/svg+xml" : "image/png",
        "Cache-Control": "no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.redirect(new URL("/favicon.ico", request.url), 307);
  }
}
