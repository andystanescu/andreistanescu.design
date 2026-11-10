import { NextRequest, NextResponse } from "next/server";
import { relativeRedirect } from "@/lib/relativeRedirect";
import { sendContactNotification } from "@/lib/email";
import { getSettings } from "@/lib/settings";
import { deleteSubmission, getSubmission, markSubmissionEmailResult, unblockSubmission } from "@/lib/submissions";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  const submission = getSubmission(id);
  if (!submission) return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  const form = await request.formData();
  const action = form.get("action");
  const category = submission.blocked ? "blocked" : submission.emailed ? "submitted" : "failed";

  if (action === "delete") {
    deleteSubmission(id);
    return relativeRedirect(`/admin/submissions?category=${category}&result=deleted`);
  }
  if (action === "unblock" && submission.blocked) {
    unblockSubmission(id);
    return relativeRedirect(`/admin/submissions?category=failed&result=unblocked#submission-${id}`);
  }
  if (action === "retry" && !submission.blocked && !submission.emailed) {
    const settings = getSettings();
    let result: { ok: true } | { ok: false; error: string };
    if (!submission.name || !submission.email || !submission.message) result = { ok: false, error: "The submission is missing a name, email, or message and cannot be sent." };
    else if (!settings.contact_email_to) result = { ok: false, error: "No destination address configured yet." };
    else result = await sendContactNotification({ to: settings.contact_email_to, name: submission.name, email: submission.email, message: submission.message, newsletter: Boolean(submission.newsletter) });
    markSubmissionEmailResult(id, result.ok, result.ok ? undefined : result.error);
    return relativeRedirect(`/admin/submissions?category=${result.ok ? "submitted" : "failed"}&result=${result.ok ? "retried" : "retry-failed"}#submission-${id}`);
  }
  return NextResponse.json({ error: "This action is not available for the submission." }, { status: 400 });
}
