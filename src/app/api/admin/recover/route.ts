import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { saveAdminCredentials, verifyCredentials } from "@/lib/auth";
import { relativeRedirect } from "@/lib/relativeRedirect";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const username = String(form.get("username") ?? "").trim();
  const currentPassword = String(form.get("currentPassword") ?? "");
  const newPassword = String(form.get("newPassword") ?? "");
  const confirmation = String(form.get("confirmation") ?? "");

  const redirectWithError = (message: string) => {
    const params = new URLSearchParams({ mode: "recovery", error: message });
    return relativeRedirect(`/admin/login?${params}`);
  };

  if (!(await verifyCredentials(username, currentPassword))) {
    return redirectWithError("We could not verify those current credentials.");
  }
  if (newPassword.length < 8) return redirectWithError("New password must be at least 8 characters.");
  if (newPassword !== confirmation) return redirectWithError("Passwords do not match.");

  saveAdminCredentials(username, await bcrypt.hash(newPassword, 12));
  const params = new URLSearchParams({
    success: "Your admin password has been updated. Sign in to continue.",
  });
  return relativeRedirect(`/admin/login?${params}`);
}
