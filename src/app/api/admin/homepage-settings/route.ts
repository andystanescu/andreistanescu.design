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
  updateSettings({
    homepage_cta_band_label: formText(form, "homepage_cta_band_label") || "Start a conversation",
    homepage_case_study_link_label: formText(form, "homepage_case_study_link_label") || "View case study",
    homepage_article_link_label: formText(form, "homepage_article_link_label") || "Read article",
    homepage_insights_all_label: formText(form, "homepage_insights_all_label") || "See all insights",
    [identity === "personal" ? "homepage_meta_title_personal" : "homepage_meta_title_business"]: metaTitle,
    [identity === "personal" ? "homepage_meta_description_personal" : "homepage_meta_description_business"]: metaDescription,
    homepage_meta_keywords: formText(form, "meta_keywords"),
    homepage_canonical_url: formText(form, "canonical_url"),
    homepage_og_image: formText(form, "og_image"),
    homepage_no_index: form.get("no_index") === "on" ? "1" : "0",
  });
  const hero = getSection("hero");
  if (hero && form.has("cta_primary_label")) {
    updateSection("hero", {
      eyebrow: hero.eyebrow,
      headline: hero.headline,
      description: hero.description,
      ctaPrimaryLabel: formText(form, "cta_primary_label"),
      ctaPrimaryHref: formText(form, "cta_primary_href"),
      ctaSecondaryLabel: formText(form, "cta_secondary_label"),
      ctaSecondaryHref: formText(form, "cta_secondary_href"),
      visible: !!hero.visible,
    });
  }
  const returnTab = form.get("return_tab") === "ctas" ? "ctas" : "metadata";
  return relativeRedirect(`/admin/homepage?tab=${returnTab}`);
}
