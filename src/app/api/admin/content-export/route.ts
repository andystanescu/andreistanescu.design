import { db } from "@/lib/db";
import { readFile } from "fs/promises";
import { basename, join } from "path";
import { getUploadsDir } from "@/lib/uploads";

export const dynamic = "force-dynamic";

export async function GET() {
  const caseStudies = db
    .prepare(
      `SELECT slug, eyebrow, title, description, tags, position, published,
              body, cover_image, thumbnail_image, category, year,
              outcome_eyebrow, outcome_title, metrics, assessment,
              password_required, author, published_at,
              meta_title, meta_description, meta_keywords, canonical_url, og_image, no_index
       FROM case_studies ORDER BY position, id`
    )
    .all();
  const insights = db
    .prepare(
      `SELECT slug, title, excerpt, body, published_at, position, published,
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
  const configuration = {
    settings: db.prepare("SELECT key, value FROM settings WHERE key != 'admin_credentials' ORDER BY key").all(),
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

  const source = JSON.stringify({ caseStudies, insights, pages, experiences, configuration });
  const filenames = [...source.matchAll(/\/uploads\/([^"'?#]+)/g)]
    .map((match) => basename(match[1]))
    .filter(Boolean);
  const assets = await Promise.all([...new Set(filenames)].map(async (filename) => {
    try {
      const bytes = await readFile(join(getUploadsDir(), filename));
      return { filename, content: bytes.toString("base64") };
    } catch {
      return null;
    }
  })).then((items) => items.filter((item): item is { filename: string; content: string } => item !== null));

  return new Response(
    JSON.stringify(
      {
        format: "conscept-content",
        version: 1,
        exportedAt: new Date().toISOString(),
        caseStudies,
        insights,
        pages,
        pageConfiguration,
        experiences,
        configuration,
        assets,
      },
      null,
      2
    ),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="conscept-content-${new Date()
          .toISOString()
          .slice(0, 10)}.json"`,
        "Cache-Control": "no-store",
      },
    }
  );
}
