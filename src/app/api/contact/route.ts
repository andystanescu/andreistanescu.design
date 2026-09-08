import { NextRequest, NextResponse } from "next/server";
import { createSubmission, markSubmissionEmailResult } from "@/lib/submissions";
import { getSettings } from "@/lib/settings";
import { sendContactNotification } from "@/lib/email";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const newsletter = Boolean(body?.newsletter);

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Name, email, and message are required." },
      { status: 400 }
    );
  }

  const id = createSubmission({ name, email, message, newsletter });
  const settings = getSettings();

  if (settings.contact_email_to) {
    const result = await sendContactNotification({
      to: settings.contact_email_to,
      name,
      email,
      message,
      newsletter,
    });
    markSubmissionEmailResult(id, result.ok, result.ok ? undefined : result.error);
  } else {
    markSubmissionEmailResult(id, false, "No destination address configured yet.");
  }

  return NextResponse.json({
    confirmationTitle: settings.confirmation_title,
    confirmationBody: settings.confirmation_body,
  });
}
