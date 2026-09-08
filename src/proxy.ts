import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

// Proxy (formerly "middleware") defaults to the Node.js runtime as of
// Next 16, which is what verifySessionToken needs (node:crypto).
//
// Covers both the admin pages AND the /api/admin mutation routes — the
// route handlers themselves do not check auth, so this is the only gate.
export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

const PUBLIC_PATHS = new Set([
  "/admin/login",
  "/api/admin/login",
  "/api/admin/setup",
  "/api/admin/recover",
  "/api/admin/recovery-request",
  "/api/admin/reset",
]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
