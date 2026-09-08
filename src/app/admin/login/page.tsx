import { hasAdminCredentials } from "@/lib/auth";
import { AdminLoginForm } from "./AdminLoginForm";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string; mode?: string; success?: string; token?: string }>;
}) {
  const { from, error, mode, success, token } = await searchParams;
  const hasCredentials = hasAdminCredentials();
  const initialMode = mode === "setup" && !hasCredentials ? "setup" : mode === "recovery" && hasCredentials ? "recovery" : mode === "request-recovery" ? "request-recovery" : mode === "reset" ? "reset" : "sign-in";
  return <AdminLoginForm initialMode={initialMode} error={error} success={success} from={from} token={token} hasCredentials={hasCredentials} />;
}
