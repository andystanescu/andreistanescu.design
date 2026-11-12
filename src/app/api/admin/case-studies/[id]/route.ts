import { relativeRedirect } from "@/lib/relativeRedirect";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveImageField } from "@/lib/uploads";
import { applyHeadingAccents } from "@/lib/headingAccents";
import { assessmentCriteriaList, getPrimaryComplexityDrivers, type EditableEngagement } from "@/data/caseStudyAssessment";
import bcrypt from "bcryptjs";
import { getSettings } from "@/lib/settings";
import { dateInputValue } from "@/lib/dateUtils";
import { addHeadingIds } from "@/lib/tableOfContents";
import { readCategorySelection, replaceCaseStudyCategories } from "@/lib/categories";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "publish");
  if (intent === "discard_body_draft") {
    db.prepare("UPDATE case_studies SET body_draft = NULL, body_draft_enabled = 0 WHERE id = ?").run(id);
    return NextResponse.json({ discarded: true });
  }
  if (intent === "save_assessment_engagements") {
    const row = db.prepare("SELECT assessment FROM case_studies WHERE id = ?").get(id) as { assessment: string } | undefined;
    if (!row) return NextResponse.json({ error: "Case study not found." }, { status: 404 });
    let currentAssessment: Record<string, unknown> = {};
    let parsedEngagements: unknown;
    try {
      currentAssessment = JSON.parse(row.assessment || "{}") as Record<string, unknown>;
      parsedEngagements = JSON.parse(String(form.get("assessment_engagements") ?? "{}"));
    } catch {
      return NextResponse.json({ error: "Engagement data could not be read." }, { status: 400 });
    }
    const engagements = Object.fromEntries(assessmentCriteriaList.map(({ key }) => [key, (Array.isArray((parsedEngagements as Record<string, unknown> | null)?.[key]) ? (parsedEngagements as Record<string, unknown[]>)[key] : [])
      .filter((item: unknown): item is EditableEngagement => Boolean(item) && typeof item === "object" && typeof (item as EditableEngagement).id === "string" && typeof (item as EditableEngagement).title === "string" && typeof (item as EditableEngagement).description === "string")
      .map((item: EditableEngagement) => ({ id: item.id.slice(0, 180), title: item.title.trim().slice(0, 180), description: item.description.trim().slice(0, 2000) }))
      .filter((item: EditableEngagement) => item.id && item.title)]));
    const conductedIds = form.getAll("assessment_conducted_engagement_id").map(String).filter(Boolean);
    const flattened = Object.values(engagements).flat();
    const nextAssessment = {
      ...currentAssessment,
      engagements,
      likelyEngagement: flattened.map((item) => item.title),
      conductedEngagementIds: conductedIds,
      conducted: flattened.filter((item) => conductedIds.includes(item.id)).map((item) => item.title),
    };
    db.prepare("UPDATE case_studies SET assessment = ? WHERE id = ?").run(JSON.stringify(nextAssessment), id);
    return NextResponse.json({ saved: true });
  }
  const slug = String(form.get("slug") ?? "").trim();
  const eyebrow = String(form.get("eyebrow") ?? "").trim();
  let categories;
  try { categories = readCategorySelection(form); } catch { return NextResponse.json({ error: "Invalid category selection" }, { status: 400 }); }
  const category = categories ? categories[0]?.name ?? "" : String(form.get("category") ?? "").trim();
  const year = String(form.get("year") ?? "").trim();
  const projectRole = String(form.get("project_role") ?? "").trim();
  const contribution = String(form.get("contribution") ?? "").trim();
  const timeline = String(form.get("timeline") ?? "").trim();
  const scope = String(form.get("scope") ?? "").trim();
  const team = String(form.get("team") ?? "").trim();
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const publishedAt = dateInputValue(String(form.get("published_at") ?? "").trim());
  const author = getSettings().author_name;
  const tags = String(form.get("tags") ?? "").trim();
  const body = applyHeadingAccents(String(form.get("body") ?? "").trim());
  const requestedAssessmentPlacement = String(form.get("assessment_placement") ?? "start");
  const assessmentPlacement = requestedAssessmentPlacement === "start" || addHeadingIds(body).toc.some((heading) => heading.id === requestedAssessmentPlacement) ? requestedAssessmentPlacement : "start";
  const metaTitle = String(form.get("meta_title") ?? "").trim();
  const metaDescription = String(form.get("meta_description") ?? "").trim();
  const metaKeywords = String(form.get("meta_keywords") ?? "").trim();
  const canonicalUrl = String(form.get("canonical_url") ?? "").trim();
  const ogImage = String(form.get("og_image") ?? "").trim();
  const noIndex = form.get("no_index") === "on" ? 1 : 0;
  const inProgress = form.get("in_progress") === "on" ? 1 : 0;
  const bodyDraftEnabled = form.get("body_draft_enabled") === "on" ? 1 : 0;
  const passwordRequired = form.get("password_required") === "on" ? 1 : 0;
  const rawPasswordAdditions = String(form.get("password_add") ?? "");
  const passwordRemovals = form.getAll("password_remove").map(Number).filter(Number.isInteger);
  const outcomeEyebrow = String(form.get("outcome_eyebrow") ?? "OUTCOMES").trim();
  const outcomeTitle = String(form.get("outcome_title") ?? "").trim();
  const metrics = JSON.stringify(Array.from({ length: 6 }, (_, i) => ({
    value: String(form.get(`metric_${i + 1}_value`) ?? "").trim(),
    label: String(form.get(`metric_${i + 1}_label`) ?? "").trim(),
  })).filter((metric) => metric.value && metric.label));
  const assessmentScores = Object.fromEntries(assessmentCriteriaList.map((criterion) => [
      criterion.key, Math.max(0, Math.min(5, Number(form.get(`assessment_score_${criterion.key}`) ?? 0) || 0)),
    ]));
  let submittedEngagements: Record<string, EditableEngagement[]> = {};
  try {
    const parsedEngagements = JSON.parse(String(form.get("assessment_engagements") ?? "{}"));
    submittedEngagements = Object.fromEntries(assessmentCriteriaList.map(({ key }) => [key, (Array.isArray(parsedEngagements?.[key]) ? parsedEngagements[key] : [])
      .filter((item: unknown): item is EditableEngagement => Boolean(item) && typeof item === "object" && typeof (item as EditableEngagement).id === "string" && typeof (item as EditableEngagement).title === "string" && typeof (item as EditableEngagement).description === "string")
      .map((item: EditableEngagement) => ({ id: item.id.slice(0, 180), title: item.title.trim().slice(0, 180), description: item.description.trim().slice(0, 2000) }))
      .filter((item: EditableEngagement) => item.id && item.title)]));
  } catch { submittedEngagements = {}; }
  const assessment = JSON.stringify({
    scores: assessmentScores,
    overall: String(form.get("assessment_overall") ?? "").trim(),
    overallDescription: String(form.get("assessment_overall_description") ?? "").trim(),
    primaryDrivers: getPrimaryComplexityDrivers(assessmentScores),
    likelyEngagement: Object.values(submittedEngagements).flat().map((item) => item.title),
    conducted: form.getAll("assessment_conducted").map(String).filter(Boolean),
    conductedEngagementIds: form.getAll("assessment_conducted_engagement_id").map(String).filter(Boolean),
    notApplicable: [],
    engagements: submittedEngagements,
    placement: assessmentPlacement,
  });

  if (!slug || !title || !description) {
    if (intent === "draft") {
      return NextResponse.json({ error: "Slug, title, and description are required before this draft can be saved." }, { status: 422 });
    }
    const url = new URL(`/admin/case-studies/${id}`, request.url);
    url.searchParams.set("error", "Slug, title, and description are required.");
    return relativeRedirect(url.pathname + url.search);
  }

  const existing = db
    .prepare("SELECT body, cover_image, thumbnail_image, published, password_hashes, published_at FROM case_studies WHERE id = ?")
    .get(id) as {
      body: string;
      cover_image: string;
      thumbnail_image: string;
      published: number;
      password_hashes: string;
      published_at: string;
    } | undefined;
  const published = intent === "publish" ? 1 : Number(existing?.published ?? 0);
  const publishedBody = intent === "publish" && !bodyDraftEnabled ? body : existing?.body ?? "";
  const bodyDraft = body === publishedBody ? null : body;
  const storedBodyDraft = intent === "publish" && !bodyDraftEnabled ? null : bodyDraft;
  const storedBodyDraftEnabled = bodyDraftEnabled;

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
  let existingPasswordHashes: Array<{ name: string; hash: string }> = [];
  try {
    const parsed = JSON.parse(existing?.password_hashes || "[]");
    existingPasswordHashes = Array.isArray(parsed) ? parsed.map((value, index) => typeof value === "string" ? { name: `Password ${index + 1}`, hash: value } : value && typeof value === "object" && typeof value.hash === "string" ? { name: typeof value.name === "string" && value.name.trim() ? value.name.trim() : `Password ${index + 1}`, hash: value.hash } : null).filter((value): value is { name: string; hash: string } => Boolean(value)) : [];
  } catch { existingPasswordHashes = []; }
  let passwordAdditions: Array<{ name: string; password: string }> = [];
  try {
    const parsed = JSON.parse(rawPasswordAdditions);
    passwordAdditions = Array.isArray(parsed) ? parsed.filter((value): value is { name: string; password: string } => Boolean(value) && typeof value.password === "string" && value.password.trim()).map((value) => ({ name: typeof value.name === "string" && value.name.trim() ? value.name.trim() : "Unnamed guest", password: value.password.trim() })) : [];
  } catch {
    passwordAdditions = rawPasswordAdditions.split(/[,;\n|]+/).map((password) => password.trim()).filter(Boolean).map((password) => ({ name: "Unnamed guest", password }));
  }
  const addedPasswordHashes = await Promise.all(passwordAdditions.map(async ({ name, password }) => ({ name, hash: await bcrypt.hash(password, 12) })));
  const passwordHashes = JSON.stringify([...existingPasswordHashes.filter((_, index) => !passwordRemovals.includes(index)), ...addedPasswordHashes]);

  try {
    db.exec("BEGIN IMMEDIATE");
    db.prepare(
      `UPDATE case_studies
       SET slug = ?, eyebrow = ?, category = ?, year = ?, project_role = ?, contribution = ?, timeline = ?, scope = ?, team = ?, title = ?, description = ?, tags = ?, body = ?, body_draft = ?, body_draft_enabled = ?, cover_image = ?, thumbnail_image = ?, outcome_eyebrow = ?, outcome_title = ?, metrics = ?, assessment = ?, password_required = ?, password_hashes = ?, published = ?, in_progress = ?, author = ?, published_at = ?, meta_title = ?, meta_description = ?, meta_keywords = ?, canonical_url = ?, og_image = ?, no_index = ?
       WHERE id = ?`
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
      publishedBody,
      storedBodyDraft,
      storedBodyDraftEnabled,
      coverImage,
      thumbnailImage,
      outcomeEyebrow,
      outcomeTitle,
      metrics,
      assessment,
      passwordRequired,
      passwordHashes,
      published,
      inProgress,
      author,
      publishedAt || dateInputValue(existing?.published_at ?? ""),
      metaTitle,
      metaDescription,
      metaKeywords,
      canonicalUrl,
      ogImage,
      noIndex,
      id
    );
    if (categories && existing) replaceCaseStudyCategories(Number(id), categories);
    db.exec("COMMIT");
  } catch {
    if (db.isTransaction) db.exec("ROLLBACK");
    const url = new URL(`/admin/case-studies/${id}`, request.url);
    url.searchParams.set("error", `A case study with slug "${slug}" already exists.`);
    return relativeRedirect(url.pathname + url.search);
  }

  if (intent === "draft") {
    return NextResponse.json({ saved: true, published: Boolean(published) });
  }

  return relativeRedirect("/admin/case-studies");
}
