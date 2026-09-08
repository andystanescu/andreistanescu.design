import { relativeRedirect } from "@/lib/relativeRedirect";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveImageField } from "@/lib/uploads";
import { applyHeadingAccents } from "@/lib/headingAccents";
import { getSettings } from "@/lib/settings";
import { todayInputValue } from "@/lib/dateUtils";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const slug = String(form.get("slug") ?? "").trim();
  const title = String(form.get("title") ?? "").trim();
  const excerpt = String(form.get("excerpt") ?? "").trim();
  const body = applyHeadingAccents(String(form.get("body") ?? "").trim());
  const publishedAt = String(form.get("published_at") ?? "").trim();
  const published = form.get("intent") === "publish" ? 1 : 0;
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
    const url = new URL("/admin/insights/new", request.url);
    url.searchParams.set("error", "Slug, title, and excerpt are required.");
    return relativeRedirect(url.pathname + url.search);
  }

  const coverImage = await resolveImageField(form, "cover_image", "");
  const thumbnailImage = await resolveImageField(form, "thumbnail_image", "");

  const maxPosition = db
    .prepare("SELECT COALESCE(MAX(position), -1) AS max FROM insights")
    .get() as { max: number };

  try {
    db.prepare(
      `INSERT INTO insights (slug, title, excerpt, body, cover_image, thumbnail_image, published_at, position, published, category, author, tags, meta_title, meta_description, meta_keywords, canonical_url, og_image, no_index)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      slug,
      title,
      excerpt,
      body,
      coverImage,
      thumbnailImage,
      publishedAt || todayInputValue(),
      maxPosition.max + 1,
      published,
      category,
      author,
      tags,
      metaTitle,
      metaDescription,
      metaKeywords,
      canonicalUrl,
      ogImage,
      noIndex
    );
  } catch {
    const url = new URL("/admin/insights/new", request.url);
    url.searchParams.set("error", `An insight with slug "${slug}" already exists.`);
    return relativeRedirect(url.pathname + url.search);
  }

  return relativeRedirect("/admin/insights");
}
