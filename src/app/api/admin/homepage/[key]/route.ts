import { relativeRedirect } from "@/lib/relativeRedirect";
import { NextRequest, NextResponse } from "next/server";
import { getSection, updateSection } from "@/lib/homepage";
import { getValueEvidenceOptions, parseValueContent } from "@/lib/homepageValue";

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
  const ctaPrimaryLabel = String(form.get("cta_primary_label") ?? getSection(key)?.cta_primary_label ?? "").trim();
  const ctaPrimaryHref = String(form.get("cta_primary_href") ?? getSection(key)?.cta_primary_href ?? "").trim();
  const ctaSecondaryLabel = String(form.get("cta_secondary_label") ?? getSection(key)?.cta_secondary_label ?? "").trim();
  const ctaSecondaryHref = String(form.get("cta_secondary_href") ?? getSection(key)?.cta_secondary_href ?? "").trim();
  const visible = form.get("visible") === "on";
  let content: string | undefined;
  if (key === "value") {
    const previous = parseValueContent(getSection(key)?.content || "{}");
    const options = getValueEvidenceOptions();
    const propositions = previous.map((item, index) => {
      const selected = String(form.get(`value_${index}_evidence`) ?? "");
      const match = /^(case_study|article):(\d+)$/.exec(selected);
      const type = match?.[1] as "case_study" | "article" | undefined;
      const id = Number(match?.[2]);
      const valid = Boolean(type && Number.isSafeInteger(id) && id > 0 && (options.some((option) => option.type === type && option.id === id) || (item.evidence?.type === type && item.evidence.id === id)));
      return { title: String(form.get(`value_${index}_title`) ?? item.title).trim(), description: String(form.get(`value_${index}_description`) ?? item.description).trim(), evidence: valid ? { type, id } : null };
    });
    content = JSON.stringify({ propositions });
  }

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
    content,
  });

  return relativeRedirect(form.get("return_tab") === "ctas" ? "/admin/homepage?tab=ctas" : "/admin/homepage");
}
