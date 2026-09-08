import { relativeRedirect } from "@/lib/relativeRedirect";
import { NextRequest, NextResponse } from "next/server";
import { getSection, updateSection } from "@/lib/about";
import { db } from "@/lib/db";
import { updateSettings } from "@/lib/settings";
import { resolveImageField } from "@/lib/uploads";

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

  const existingHeroImage = db
    .prepare("SELECT value FROM settings WHERE key = 'about_hero_image'")
    .get() as { value: string } | undefined;
  const aboutHeroImage = await resolveImageField(
    form,
    "about_hero_image",
    existingHeroImage?.value ?? ""
  );

  if (!headline) {
    const url = new URL(`/admin/about/${key}`, request.url);
    url.searchParams.set("error", "Headline is required.");
    return relativeRedirect(url.pathname + url.search);
  }

  updateSection(key, { eyebrow, headline, description, visible });
  if (key === "hero") {
    updateSettings({ about_hero_image: aboutHeroImage });
  }

  return relativeRedirect(form.get("return_tab") === "experiences" ? "/admin/about-experiences" : "/admin/about");
}
