import { NextRequest } from "next/server";
import { updateSettings } from "@/lib/settings";
import { relativeRedirect } from "@/lib/relativeRedirect";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  updateSettings({
    footer_message: String(form.get("footer_message") ?? "").trim(),
    footer_show_services: form.has("footer_show_services") ? "1" : "0",
    footer_show_navigation: form.has("footer_show_navigation") ? "1" : "0",
    footer_show_contact: form.has("footer_show_contact") ? "1" : "0",
    footer_contact_label: String(form.get("footer_contact_label") ?? "").trim() || "Let's talk",
    footer_contact_title: String(form.get("footer_contact_title") ?? "").trim(),
    footer_contact_message: String(form.get("footer_contact_message") ?? "").trim(),
    footer_copyright: String(form.get("footer_copyright") ?? "").replace(/^\s*©\s*/, "").trim(),
  });
  return relativeRedirect("/admin/pages?saved=footer#footer-controls");
}
