import { NextRequest } from "next/server";
import { relativeRedirect } from "@/lib/relativeRedirect";
import { getSettings, updateSettings } from "@/lib/settings";
import { getSection, updateSection } from "@/lib/homepage";

function formText(form: FormData, name: string, fallback = "") {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : fallback;
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const identity = getSettings().logo_identity;
  const metaTitle = formText(form, "meta_title");
  const metaDescription = formText(form, "meta_description");
  if (form.get("return_tab") === "ctas") {
    const hero = getSection("hero");
    if (hero && form.has("cta_primary_label")) {
      updateSection("hero", {
        eyebrow: hero.eyebrow,
        headline: hero.headline,
        description: hero.description,
        ctaPrimaryLabel: formText(form, "cta_primary_label") || "See my work",
        ctaPrimaryHref: formText(form, "cta_primary_href") || "/work",
        ctaSecondaryLabel: formText(form, "cta_secondary_label") || "Read articles",
        ctaSecondaryHref: formText(form, "cta_secondary_href") || "/insights",
        visible: !!hero.visible,
      });
    }
    return relativeRedirect("/admin/homepage?tab=ctas");
  }

  updateSettings({
    [identity === "personal" ? "homepage_meta_title_personal" : "homepage_meta_title_business"]: metaTitle,
    [identity === "personal" ? "homepage_meta_description_personal" : "homepage_meta_description_business"]: metaDescription,
    homepage_meta_keywords: formText(form, "meta_keywords"),
    homepage_canonical_url: formText(form, "canonical_url"),
    homepage_og_image: formText(form, "og_image"),
    homepage_no_index: form.get("no_index") === "on" ? "1" : "0",
  });
  return relativeRedirect("/admin/homepage?tab=metadata");
}
