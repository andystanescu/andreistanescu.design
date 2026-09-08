import { NextRequest } from "next/server";
import { createAdminRecoveryToken } from "@/lib/adminRecovery";
import { sendAdminRecoveryEmail } from "@/lib/email";
import { relativeRedirect } from "@/lib/relativeRedirect";

export async function POST(request: NextRequest) {
  const email = process.env.ADMIN_RECOVERY_EMAIL?.trim();
  const genericMessage = "If recovery is configured, a reset link has been sent. Check your email and follow the link within 15 minutes.";

  if (email) {
    const token = createAdminRecoveryToken();
    const baseUrl = process.env.PUBLIC_SITE_URL?.trim() || request.nextUrl.origin;
    const resetUrl = `${baseUrl.replace(/\/$/, "")}/admin/login?mode=reset&token=${encodeURIComponent(token)}`;
    const result = await sendAdminRecoveryEmail({ to: email, resetUrl });
    if (!result.ok) {
      console.error("Admin recovery email failed:", result.error);
    }
  }

  const params = new URLSearchParams({ mode: "request-recovery", success: genericMessage });
  return relativeRedirect(`/admin/login?${params}`);
}
