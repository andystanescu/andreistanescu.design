import { NextRequest, NextResponse } from "next/server";
import { LOGO_HEADERS, mappedLogo } from "@/lib/mappedLogo";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const variant = request.nextUrl.searchParams.get("variant") === "icon" ? "icon" : "full";
  const mode = request.nextUrl.searchParams.get("mode") === "dark" ? "dark" : "light";
  const logo = await mappedLogo(variant, mode);
  return logo ? new Response(logo.body, {headers: {...LOGO_HEADERS, "Content-Type": logo.type}}) : new NextResponse(null, {status: 404});
}
