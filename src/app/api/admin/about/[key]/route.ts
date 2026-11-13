import { relativeRedirect } from "@/lib/relativeRedirect";
import { NextRequest, NextResponse } from "next/server";
import { getSection, updateSection } from "@/lib/about";
import { db } from "@/lib/db";
import { updateSettings } from "@/lib/settings";
import { resolveImageField, resolvePdfField } from "@/lib/uploads";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  if (!getSection(key)) {
    return NextResponse.json({ error: "Unknown section." }, { status: 404 });
  }

  const form = await request.formData();
  const eyebrow = String(form.get("eyebrow") ?? "").trim();
  const headline = String(form.get("headline") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const visible = form.get("visible") === "on";

  if (!headline) {
    const url = new URL(`/admin/about/${key}`, request.url);
    url.searchParams.set("error", "Headline is required.");
    return relativeRedirect(url.pathname + url.search);
  }

  const cvFile = form.get("about_cv");
  if (key === "hero" && cvFile instanceof File && cvFile.size > 0 && (cvFile.type !== "application/pdf" || cvFile.size > 5 * 1024 * 1024)) {
    return relativeRedirect(`/admin/about?error=${encodeURIComponent("Choose a PDF no larger than 5 MB.")}`);
  }

  const existingHeroImage = db
    .prepare("SELECT value FROM settings WHERE key = 'about_hero_image'")
    .get() as { value: string } | undefined;
  const aboutHeroImage = await resolveImageField(
    form,
    "about_hero_image",
    existingHeroImage?.value ?? ""
  );

  const ctaLabel = form.has("cta_label") ? String(form.get("cta_label") ?? "").trim() : undefined;
  const existingCv = key === "hero" ? db.prepare("SELECT value FROM settings WHERE key = 'about_cv'").get() as { value: string } | undefined : undefined;
  const removeCv = key === "hero" && form.get("about_cv_remove") === "1";
  const aboutCv = key === "hero" ? (removeCv ? "" : await resolvePdfField(form, "about_cv", existingCv?.value ?? "")) : undefined;
  updateSection(key, { eyebrow, headline, description, ctaLabel, visible });
  if (key === "hero") {
    updateSettings({ about_hero_image: aboutHeroImage, about_cv: aboutCv,
      ...(removeCv ? { about_cv_name: "", about_cv_size: "" } : cvFile instanceof File && cvFile.size > 0 ? { about_cv_name: cvFile.name, about_cv_size: String(cvFile.size) } : {}),
    });
  }

  return relativeRedirect(form.get("return_tab") === "experiences" ? "/admin/about-experiences" : "/admin/about");
}
