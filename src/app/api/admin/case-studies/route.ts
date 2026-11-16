import { relativeRedirect } from "@/lib/relativeRedirect";
import { overviewFromForm } from "@/lib/caseStudyOverview";
import { applyPendingCategoryAssignments } from "@/lib/pendingCategoryAssignments";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { resolveImageField } from "@/lib/uploads";
import { applyHeadingAccents } from "@/lib/headingAccents";
import { getSettings } from "@/lib/settings";
import { dateInputValue } from "@/lib/dateUtils";
import { readCategorySelection, replaceCaseStudyCategories } from "@/lib/categories";
import bcrypt from "bcryptjs";
import { getSessionSecret } from "@/lib/auth";
import { encryptCaseStudyPassword } from "@/lib/caseStudyPasswordEncryption";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const slug = String(form.get("slug") ?? "").trim();
  const eyebrow = String(form.get("eyebrow") ?? "").trim();
  let categories;
  try { categories = readCategorySelection(form); } catch { return new Response("Invalid category selection", { status: 400 }); }
  const category = categories ? categories[0]?.name ?? "" : String(form.get("category") ?? "").trim();
  const year = String(form.get("year") ?? "").trim();
  const projectRole = String(form.get("project_role") ?? "").trim();
  const contribution = String(form.get("contribution") ?? "").trim();
  const timeline = String(form.get("timeline") ?? "").trim();
  const scope = String(form.get("scope") ?? "").trim();
  const team = String(form.get("team") ?? "").trim();
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
  const inProgress = form.get("in_progress") === "on" ? 1 : 0;
  const author = getSettings().author_name;
  const publishedAt = dateInputValue(String(form.get("published_at") ?? "").trim());
  const passwordRequired = form.get("password_required") === "on" ? 1 : 0;
  let additions: Array<{ name: string; password: string }> = [];
  try {
    const parsed: unknown = JSON.parse(String(form.get("password_add") ?? "[]"));
    if (Array.isArray(parsed)) additions = parsed.filter((entry): entry is { name: string; password: string } => Boolean(entry) && typeof entry.password === "string" && Boolean(entry.password.trim())).map((entry) => ({ name: typeof entry.name === "string" && entry.name.trim() ? entry.name.trim() : "Unnamed guest", password: entry.password.trim() }));
  } catch { additions = []; }
  const uniqueAdditions = additions.filter((entry, index) => additions.findIndex((other) => other.password === entry.password) === index);
  const passwordHashes = await Promise.all(uniqueAdditions.map(async (entry) => ({ ...entry, hash: await bcrypt.hash(entry.password, 12) })));

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
    db.exec("BEGIN IMMEDIATE");
    const result = db.prepare(
      `INSERT INTO case_studies (slug, eyebrow, category, year, project_role, contribution, timeline, scope, team, title, description, tags, body, cover_image, thumbnail_image, position, published, in_progress, author, published_at, meta_title, meta_description, meta_keywords, canonical_url, og_image, no_index, overview)
       VALUES (${Array(27).fill("?").join(",")})`
    ).run(
      slug,
      eyebrow,
      category,
      year,
      projectRole,
      contribution,
      timeline,
      scope,
      team,
      title,
      description,
      tags,
      body,
      coverImage,
      thumbnailImage,
      maxPosition.max + 1,
      published,
      inProgress,
      author,
      publishedAt,
      metaTitle,
      metaDescription,
      metaKeywords,
      canonicalUrl,
      ogImage,
      noIndex,
      overviewFromForm(form)
    );
    if (categories) replaceCaseStudyCategories(Number(result.lastInsertRowid), categories);
    applyPendingCategoryAssignments(db, Number(result.lastInsertRowid), slug);
    if (passwordRequired || passwordHashes.length) {
      const studyId = String(result.lastInsertRowid);
      const entries = passwordHashes.map(({ name, password, hash }) => ({ name, hash, encrypted: encryptCaseStudyPassword(password, getSessionSecret(), studyId) }));
      db.prepare("UPDATE case_studies SET password_required = ?, password_hashes = ? WHERE id = ?").run(passwordRequired, JSON.stringify(entries), studyId);
    }
    db.exec("COMMIT");
  } catch {
    if (db.isTransaction) db.exec("ROLLBACK");
    const url = new URL("/admin/case-studies/new", request.url);
    url.searchParams.set("error", `A case study with slug "${slug}" already exists.`);
    return relativeRedirect(url.pathname + url.search);
  }

  return relativeRedirect("/admin/case-studies");
}
