import { NextRequest, NextResponse } from "next/server";
import { createSubmission, markSubmissionEmailResult } from "@/lib/submissions";
import { getSettings } from "@/lib/settings";
import { sendContactNotification } from "@/lib/email";
import { recordEngagementBatch } from "@/lib/analytics";
import { MEASUREMENT_VERSION } from "@/lib/engagementMeasurement";
import { journeyCountryFromHeaders } from "@/lib/journeyContext";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { randomUUID } from "node:crypto";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (typeof body?.company_website === "string" && body.company_website.trim()) {
    const bounded = (value: unknown, limit: number) => typeof value === "string" ? value.trim().slice(0, limit) : "";
    createSubmission({ name: bounded(body.name, 200), email: bounded(body.email, 320), message: bounded(body.message, 5000), newsletter: false, blocked: true });
    const settings = getSettings();
    return NextResponse.json({ confirmationTitle: settings.confirmation_title, confirmationBody: settings.confirmation_body });
  }
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

  // A conversion is recorded only after a real, non-honeypot submission is accepted.
  // Analytics must never prevent an accepted enquiry from reaching the user.
  const sessionId = typeof body?.engagementSession === "string" ? body.engagementSession : "";
  if (sessionId && !verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value)) {
    try {
      recordEngagementBatch(sessionId, [{ eventId: randomUUID(), type: "action", pageKey: "/contact", contentType: "contact", detail: "contact_submission" }], request.headers.get("user-agent") || "", "Direct", MEASUREMENT_VERSION, true, journeyCountryFromHeaders(request.headers));
    } catch { /* The stored submission remains authoritative. */ }
  }

  return NextResponse.json({
    confirmationTitle: settings.confirmation_title,
    confirmationBody: settings.confirmation_body,
  });
}
