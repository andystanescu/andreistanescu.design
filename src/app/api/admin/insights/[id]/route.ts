import { relativeRedirect } from "@/lib/relativeRedirect";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Insight } from "@/data/insights";
import { resolveImageField } from "@/lib/uploads";
import { applyHeadingAccents } from "@/lib/headingAccents";
import { getSettings } from "@/lib/settings";
import { dateInputValue } from "@/lib/dateUtils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const form = await request.formData();
  const slug = String(form.get("slug") ?? "").trim();
  const title = String(form.get("title") ?? "").trim();
  const excerpt = String(form.get("excerpt") ?? "").trim();
  const body = applyHeadingAccents(String(form.get("body") ?? "").trim());
  const publishedAt = dateInputValue(String(form.get("published_at") ?? "").trim());
  const published = form.get("published") ? 1 : 0;
  const category = String(form.get("category") ?? "").trim();
  const author = getSettings().author_name;
  const tags = String(form.get("tags") ?? "").trim();
  const metaTitle = String(form.get("meta_title") ?? "").trim();
  const metaDescription = String(form.get("meta_description") ?? "").trim();
  const metaKeywords = String(form.get("meta_keywords") ?? "").trim();
  const canonicalUrl = String(form.get("canonical_url") ?? "").trim();
  const ogImage = String(form.get("og_image") ?? "").trim();
  const noIndex = form.get("no_index") === "on" ? 1 : 0;

  if (!slug || !title || !excerpt) {
    const url = new URL(`/admin/insights/${id}`, request.url);
    url.searchParams.set("error", "Slug, title, and excerpt are required.");
    return relativeRedirect(url.pathname + url.search);
  }

  const existing = db
    .prepare("SELECT cover_image, thumbnail_image FROM insights WHERE id = ?")
    .get(id) as Pick<Insight, "cover_image" | "thumbnail_image"> | undefined;

  const coverImage = await resolveImageField(
    form,
    "cover_image",
    existing?.cover_image ?? ""
  );
  const thumbnailImage = await resolveImageField(
    form,
    "thumbnail_image",
    existing?.thumbnail_image ?? ""
  );

  try {
    db.prepare(
      `UPDATE insights
       SET slug = ?, title = ?, excerpt = ?, body = ?, cover_image = ?, thumbnail_image = ?, published_at = ?, published = ?, category = ?, author = ?, tags = ?, meta_title = ?, meta_description = ?, meta_keywords = ?, canonical_url = ?, og_image = ?, no_index = ?
       WHERE id = ?`
    ).run(
      slug,
      title,
      excerpt,
      body,
      coverImage,
      thumbnailImage,
      publishedAt,
      published,
      category,
      author,
      tags,
      metaTitle,
      metaDescription,
      metaKeywords,
      canonicalUrl,
      ogImage,
      noIndex,
      id
    );
  } catch {
    const url = new URL(`/admin/insights/${id}`, request.url);
    url.searchParams.set("error", `An insight with slug "${slug}" already exists.`);
    return relativeRedirect(url.pathname + url.search);
  }

  return relativeRedirect("/admin/insights");
}
