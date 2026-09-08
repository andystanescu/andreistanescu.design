import { relativeRedirect } from "@/lib/relativeRedirect";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { updateSettings } from "@/lib/settings";
import { resolveImageField, resolvePdfField } from "@/lib/uploads";

export async function POST(request: NextRequest) {
  const form = await request.formData();

  // Raw (unfallback) values — getSettings() merges an unset footer logo
  // into the header logo, which would wrongly get "baked in" as a
  // permanent copy if used here instead of staying empty/dynamic.
  const rawLogoImage = db
    .prepare("SELECT value FROM settings WHERE key = 'logo_image'")
    .get() as { value: string } | undefined;
  const rawLogoImageFooter = db
    .prepare("SELECT value FROM settings WHERE key = 'logo_image_footer'")
    .get() as { value: string } | undefined;
  const rawAboutHeroImage = db
    .prepare("SELECT value FROM settings WHERE key = 'about_hero_image'")
    .get() as { value: string } | undefined;
  const rawAboutCv = db
    .prepare("SELECT value FROM settings WHERE key = 'about_cv'")
    .get() as { value: string } | undefined;

  const logoImage = await resolveImageField(
    form,
    "logo_image",
    rawLogoImage?.value ?? ""
  );
  const logoImageFooter = await resolveImageField(
    form,
    "logo_image_footer",
    rawLogoImageFooter?.value ?? ""
  );
  const aboutHeroImage = await resolveImageField(
    form,
    "about_hero_image",
    rawAboutHeroImage?.value ?? ""
  );
  const aboutCv = await resolvePdfField(form, "about_cv", rawAboutCv?.value ?? "");

  updateSettings({
    author_name: String(form.get("author_name") ?? "").trim() || "Andrei Stanescu",
    logo_identity: form.get("logo_identity") === "personal" ? "personal" : "business",
    confirmation_title: String(form.get("confirmation_title") ?? "").trim(),
    confirmation_body: String(form.get("confirmation_body") ?? "").trim(),
    contact_email_to: String(form.get("contact_email_to") ?? "").trim(),
    logo_image: logoImage,
    logo_image_footer: logoImageFooter,
    about_hero_image: aboutHeroImage,
    about_cv: aboutCv,
  });
  return relativeRedirect("/admin");
}
