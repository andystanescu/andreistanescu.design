import { NextResponse } from "next/server";

// Use a relative Location header for same-site navigation.
export function relativeRedirect(path: string, status = 303) {
  const response = new NextResponse(null, { status });
  response.headers.set("Location", path);
  return response;
}
