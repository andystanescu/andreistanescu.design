import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { readFile } from "fs/promises";
import { basename, join } from "path";
import { getUploadsDir } from "@/lib/uploads";
import { parseTransferSelection, settingTransferGroup, TRANSFER_GROUPS, transferGroupSource, uploadFilenames } from "@/lib/contentTransfer";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const includeAssets = request.nextUrl.searchParams.get("includeAssets") === "1";
  const hasSelection = request.nextUrl.searchParams.has("content");
  const selected = hasSelection ? parseTransferSelection(request.nextUrl.searchParams.get("content")) : new Set(TRANSFER_GROUPS.map(({ key }) => key));
  const imageGroups = hasSelection ? parseTransferSelection(request.nextUrl.searchParams.get("images")) : new Set(includeAssets ? selected : []);
  if (!selected.size) return Response.json({ error: "Select at least one content type." }, { status: 400 });
  const caseStudies = (db
    .prepare(
      `SELECT slug, eyebrow, title, description, tags, position, published, in_progress,
              body, body_draft, body_draft_enabled, cover_image, thumbnail_image, category, year,
              project_role, contribution, timeline, scope, team,
              outcome_eyebrow, outcome_title, metrics, assessment,
              password_required, author, published_at,
              meta_title, meta_description, meta_keywords, canonical_url, og_image, no_index
       FROM case_studies ORDER BY position, id`
    )
    .all() as Array<Record<string, unknown>>).map((study) => ({
      ...study,
      category_names: (db.prepare(`SELECT c.name FROM case_study_categories sc JOIN categories c ON c.id = sc.category_id JOIN case_studies s ON s.id = sc.case_study_id WHERE s.slug = ? ORDER BY sc.position, c.name`).all(study.slug as string) as Array<{ name: string }>).map((category) => category.name),
    }));
  const insights = db
    .prepare(
      `SELECT slug, title, excerpt, body, published_at, scheduled_at, position, published,
              cover_image, thumbnail_image, category, author, tags
              , meta_title, meta_description, meta_keywords, canonical_url, og_image, no_index
       FROM insights ORDER BY position, id`
    )
    .all();
  const pages = db.prepare(
    `SELECT slug, eyebrow, title, body, show_in_nav, visible, nav_label, position,
            meta_title, meta_description, meta_keywords, canonical_url, og_image, no_index
     FROM pages ORDER BY position, slug`
  ).all();
  const experiences = db.prepare(
    `SELECT id, start_date, end_date, job_title, company_name, business_profile,
            description, position, published
     FROM about_experiences ORDER BY position, id`
  ).all();
  const analyticsEvents = db.prepare(
    `SELECT event_key, event_type, content_type, content_id, source, country,
            visitor_hash, created_at
     FROM analytics_events ORDER BY created_at, id`
  ).all();
  const configuration = {
    categories: db.prepare("SELECT name, description, position FROM categories ORDER BY position, id").all(),
    settings: db.prepare("SELECT key, value FROM settings WHERE key NOT IN ('admin_credentials', 'session_secret', 'shared_categories_v1') ORDER BY key").all(),
    homepageSections: db.prepare("SELECT * FROM homepage_sections ORDER BY position, key").all(),
    services: db.prepare("SELECT * FROM service_items ORDER BY position, id").all(),
    approachSteps: db.prepare("SELECT * FROM approach_steps ORDER BY position, id").all(),
    aboutSections: db.prepare("SELECT * FROM about_sections ORDER BY position, key").all(),
    aboutPhilosophyItems: db.prepare("SELECT * FROM about_philosophy_items ORDER BY position, id").all(),
    aboutHighlightItems: db.prepare("SELECT * FROM about_highlight_items ORDER BY position, id").all(),
  };
  const pageConfiguration = (pages as Array<Record<string, unknown>>).map((page) => ({
    slug: page.slug,
    visible: page.visible,
    show_in_nav: page.show_in_nav,
    nav_label: page.nav_label,
    position: page.position,
  }));
  const pageContent = (pages as Array<Record<string, unknown>>).map((page) => Object.fromEntries(Object.entries(page).filter(([key]) => !["show_in_nav", "visible", "nav_label", "position"].includes(key))));
  const groupedSettings = (configuration.settings as Array<{ key: string; value: string }>).filter(({ key }) => selected.has(settingTransferGroup(key)));
  const selectedConfiguration = {
    settings: groupedSettings,
    ...(selected.has("services") ? { categories: configuration.categories, services: configuration.services } : {}),
    ...(selected.has("pages") ? { homepageSections: configuration.homepageSections, approachSteps: configuration.approachSteps, aboutSections: configuration.aboutSections, aboutPhilosophyItems: configuration.aboutPhilosophyItems, aboutHighlightItems: configuration.aboutHighlightItems } : {}),
  };

  let assets: { filename: string; content: string }[] | undefined;
  if (imageGroups.size) {
    const all = { caseStudies, insights, pages: { pages: pageContent, experiences, settings: groupedSettings.filter(({ key }) => settingTransferGroup(key) === "pages"), homepageSections: configuration.homepageSections, approachSteps: configuration.approachSteps, aboutSections: configuration.aboutSections, aboutPhilosophyItems: configuration.aboutPhilosophyItems, aboutHighlightItems: configuration.aboutHighlightItems }, siteIdentity: groupedSettings.filter(({ key }) => settingTransferGroup(key) === "siteIdentity"), services: configuration.services, siteSettings: groupedSettings.filter(({ key }) => settingTransferGroup(key) === "siteSettings"), analyticsEvents };
    const filenames = [...imageGroups].filter((key) => selected.has(key)).flatMap((key) => [...uploadFilenames(transferGroupSource(all, key))]).map((name) => basename(name));
    assets = await Promise.all([...new Set(filenames)].map(async (filename) => {
      try {
        const bytes = await readFile(join(getUploadsDir(), filename));
        return { filename, content: bytes.toString("base64") };
      } catch {
        return null;
      }
    })).then((items) => items.filter((item): item is { filename: string; content: string } => item !== null));
  }

  return new Response(
    JSON.stringify(
      {
        format: "conscept-content",
        version: 1,
        exportedAt: new Date().toISOString(),
        ...(selected.has("caseStudies") ? { caseStudies } : {}),
        ...(selected.has("insights") ? { insights } : {}),
        ...(selected.has("pages") ? { pages: pageContent, experiences } : {}),
        ...(selected.has("navigation") ? { pageConfiguration } : {}),
        ...(selected.has("analyticsEvents") ? { analyticsEvents } : {}),
        ...(selectedConfiguration.settings.length || selected.has("services") || selected.has("pages") ? { configuration: selectedConfiguration } : {}),
        ...(assets ? { assets } : {}),
      },
      null,
      2
    ),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="conscept-content${includeAssets ? "-with-assets" : ""}-${new Date()
          .toISOString()
          .slice(0, 10)}.json"`,
        "Cache-Control": "no-store",
      },
    }
  );
}
