import { relativeRedirect } from "@/lib/relativeRedirect";
import { NextRequest, NextResponse } from "next/server";
import { getSection, updateSection } from "@/lib/homepage";

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
  const ctaPrimaryLabel = String(form.get("cta_primary_label") ?? "").trim();
  const ctaPrimaryHref = String(form.get("cta_primary_href") ?? "").trim();
  const ctaSecondaryLabel = String(form.get("cta_secondary_label") ?? "").trim();
  const ctaSecondaryHref = String(form.get("cta_secondary_href") ?? "").trim();
  const visible = form.get("visible") === "on";

  if (!headline) {
    const url = new URL(`/admin/homepage/${key}`, request.url);
    url.searchParams.set("error", "Headline is required.");
    return relativeRedirect(url.pathname + url.search);
  }

  updateSection(key, {
    eyebrow,
    headline,
    description,
    ctaPrimaryLabel,
    ctaPrimaryHref,
    ctaSecondaryLabel,
    ctaSecondaryHref,
    visible,
  });

  return relativeRedirect(form.get("return_tab") === "ctas" ? "/admin/homepage?tab=ctas" : "/admin/homepage");
}
