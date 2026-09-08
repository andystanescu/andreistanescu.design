import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { hasAdminCredentials, saveAdminCredentials } from "@/lib/auth";
import { relativeRedirect } from "@/lib/relativeRedirect";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const username = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const confirmation = String(form.get("confirmation") ?? "");

  const redirectWithError = (message: string) => {
    const params = new URLSearchParams({ mode: "setup", error: message });
    return relativeRedirect(`/admin/login?${params}`);
  };

  if (hasAdminCredentials()) {
    return redirectWithError("Admin credentials have already been created. Use recovery instead.");
  }
  if (username.length < 3) return redirectWithError("Username must be at least 3 characters.");
  if (password.length < 8) return redirectWithError("Password must be at least 8 characters.");
  if (password !== confirmation) return redirectWithError("Passwords do not match.");

  saveAdminCredentials(username, await bcrypt.hash(password, 12));
  const params = new URLSearchParams({
    success: "Your admin password is ready. Sign in to continue.",
  });
  return relativeRedirect(`/admin/login?${params}`);
}
