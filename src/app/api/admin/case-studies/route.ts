import { relativeRedirect } from "@/lib/relativeRedirect";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveImageField } from "@/lib/uploads";
import { applyHeadingAccents } from "@/lib/headingAccents";
import { getSettings } from "@/lib/settings";
import { dateInputValue } from "@/lib/dateUtils";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const slug = String(form.get("slug") ?? "").trim();
  const eyebrow = String(form.get("eyebrow") ?? "").trim();
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const tags = String(form.get("tags") ?? "").trim();
  const metaTitle = String(form.get("meta_title") ?? "").trim();
  const metaDescription = String(form.get("meta_description") ?? "").trim();
  const metaKeywords = String(form.get("meta_keywords") ?? "").trim();
  const canonicalUrl = String(form.get("canonical_url") ?? "").trim();
  const ogImage = String(form.get("og_image") ?? "").trim();
  const noIndex = form.get("no_index") === "on" ? 1 : 0;
  const body = applyHeadingAccents(String(form.get("body") ?? "").trim());
  const published = form.get("intent") === "publish" ? 1 : 0;
  const author = getSettings().author_name;
  const publishedAt = dateInputValue(String(form.get("published_at") ?? "").trim());

  if (!slug || !title || !description) {
    const url = new URL("/admin/case-studies/new", request.url);
    url.searchParams.set("error", "Slug, title, and description are required.");
    return relativeRedirect(url.pathname + url.search);
  }

  const coverImage = await resolveImageField(form, "cover_image", "");
  const thumbnailImage = await resolveImageField(form, "thumbnail_image", "");

  const maxPosition = db
    .prepare("SELECT COALESCE(MAX(position), -1) AS max FROM case_studies")
    .get() as { max: number };

  try {
    db.prepare(
      `INSERT INTO case_studies (slug, eyebrow, title, description, tags, body, cover_image, thumbnail_image, position, published, author, published_at, meta_title, meta_description, meta_keywords, canonical_url, og_image, no_index)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      slug,
      eyebrow,
      title,
      description,
      tags,
      body,
      coverImage,
      thumbnailImage,
      maxPosition.max + 1,
      published,
      author,
      publishedAt,
      metaTitle,
      metaDescription,
      metaKeywords,
      canonicalUrl,
      ogImage,
      noIndex
    );
  } catch {
    const url = new URL("/admin/case-studies/new", request.url);
    url.searchParams.set("error", `A case study with slug "${slug}" already exists.`);
    return relativeRedirect(url.pathname + url.search);
  }

  return relativeRedirect("/admin/case-studies");
}
