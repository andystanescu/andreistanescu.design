import { NextRequest } from "next/server";
import { LOGO_HEADERS, mappedLogo } from "@/lib/mappedLogo";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("mode") === "dark" ? "dark" : "light";
  const logo = await mappedLogo("icon", mode);
  return logo ? new Response(logo.body, {headers: {...LOGO_HEADERS, "Content-Type": logo.type}}) : new Response(null, {status: 404, headers: LOGO_HEADERS});
}
