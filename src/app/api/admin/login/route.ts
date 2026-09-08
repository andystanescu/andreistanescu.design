import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, verifyCredentials, SESSION_COOKIE_NAME } from "@/lib/auth";
import { relativeRedirect } from "@/lib/relativeRedirect";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const username = String(form.get("username") ?? "");
  const password = String(form.get("password") ?? "");

  let valid = false;
  try {
    valid = await verifyCredentials(username, password);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login is not configured.";
    const params = new URLSearchParams({ error: message });
    return relativeRedirect(`/admin/login?${params}`);
  }

  if (!valid) {
    const params = new URLSearchParams({ error: "Incorrect username or password." });
    return relativeRedirect(`/admin/login?${params}`);
  }

  const from = String(form.get("from") ?? "/admin");
  const redirectTo = from.startsWith("/admin") ? from : "/admin";
  const response = relativeRedirect(redirectTo);
  response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
