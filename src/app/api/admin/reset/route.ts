import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { consumeAdminRecoveryToken } from "@/lib/adminRecovery";
import { saveAdminCredentials } from "@/lib/auth";
import { relativeRedirect } from "@/lib/relativeRedirect";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const token = String(form.get("token") ?? "");
  const username = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const confirmation = String(form.get("confirmation") ?? "");
  const fail = (message: string) => relativeRedirect(`/admin/login?mode=reset&token=${encodeURIComponent(token)}&error=${encodeURIComponent(message)}`);

  if (!consumeAdminRecoveryToken(token)) return fail("This recovery link is invalid or has expired. Request a new one.");
  if (username.length < 3) return fail("Username must be at least 3 characters.");
  if (password.length < 8) return fail("Password must be at least 8 characters.");
  if (password !== confirmation) return fail("Passwords do not match.");

  saveAdminCredentials(username, await bcrypt.hash(password, 12));
  return relativeRedirect(`/admin/login?success=${encodeURIComponent("Your admin credentials have been updated. Sign in to continue.")}`);
}
