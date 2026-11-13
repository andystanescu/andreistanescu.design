import { relativeRedirect } from "@/lib/relativeRedirect";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { updateSettings } from "@/lib/settings";
import { resolveImageField } from "@/lib/uploads";

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

  updateSettings({
    logo_image: logoImage,
    logo_image_footer: logoImageFooter,
    about_hero_image: aboutHeroImage,
  });
  return relativeRedirect("/admin");
}
