import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mkdir, writeFile } from "fs/promises";
import { basename, join } from "path";
import { getUploadsDir } from "@/lib/uploads";

type ContentRecord = Record<string, unknown>;

function text(record: ContentRecord, key: string, fallback = "") {
  return typeof record[key] === "string" ? record[key] : fallback;
}

function integer(record: ContentRecord, key: string, fallback = 0) {
  return typeof record[key] === "number" ? Math.round(record[key] as number) : fallback;
}

function list(value: unknown) {
  return Array.isArray(value) ? JSON.stringify(value) : typeof value === "string" ? value : "[]";
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose a content JSON file first." }, { status: 400 });
    }

    const payload = JSON.parse(await file.text()) as {
      format?: string;
      version?: number;
      caseStudies?: ContentRecord[];
      insights?: ContentRecord[];
      pages?: ContentRecord[];
      pageConfiguration?: ContentRecord[];
      experiences?: ContentRecord[];
      assets?: { filename?: string; content?: string }[];
      configuration?: {
        settings?: ContentRecord[];
        homepageSections?: ContentRecord[];
        services?: ContentRecord[];
        approachSteps?: ContentRecord[];
        aboutSections?: ContentRecord[];
        aboutPhilosophyItems?: ContentRecord[];
        aboutHighlightItems?: ContentRecord[];
      };
    };
    if (payload.format !== "conscept-content" || payload.version !== 1) {
      return NextResponse.json({ error: "This is not a compatible ConScept content export." }, { status: 400 });
    }

    const caseStudies = Array.isArray(payload.caseStudies) ? payload.caseStudies : [];
    const insights = Array.isArray(payload.insights) ? payload.insights : [];
    const pages = Array.isArray(payload.pages)
      ? payload.pages
      : Array.isArray(payload.pageConfiguration)
        ? payload.pageConfiguration
        : [];
    const experiences = Array.isArray(payload.experiences) ? payload.experiences : [];
    const configuration = payload.configuration ?? {};

    if (Array.isArray(payload.assets)) {
      const uploadsDir = getUploadsDir();
      await mkdir(uploadsDir, { recursive: true });
      for (const asset of payload.assets) {
        const filename = typeof asset.filename === "string" ? basename(asset.filename) : "";
        if (!filename || filename !== asset.filename || typeof asset.content !== "string") continue;
        await writeFile(join(uploadsDir, filename), Buffer.from(asset.content, "base64"));
      }
    }

    db.exec("BEGIN");
    try {
      const settings = Array.isArray(configuration.settings) ? configuration.settings : [];
      const saveSetting = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
      for (const record of settings) {
        const key = text(record, "key").trim();
        if (key && key !== "admin_credentials") saveSetting.run(key, text(record, "value"));
      }

      const homepageSections = Array.isArray(configuration.homepageSections) ? configuration.homepageSections : [];
      const saveHomepageSection = db.prepare(`INSERT OR REPLACE INTO homepage_sections
        (key, eyebrow, headline, description, position, fixed, cta_primary_label,
         cta_primary_href, cta_secondary_label, cta_secondary_href, visible)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      for (const record of homepageSections) {
        const key = text(record, "key").trim();
        if (key) saveHomepageSection.run(key, text(record, "eyebrow"), text(record, "headline"), text(record, "description"), integer(record, "position"), integer(record, "fixed"), text(record, "cta_primary_label"), text(record, "cta_primary_href"), text(record, "cta_secondary_label"), text(record, "cta_secondary_href"), integer(record, "visible", 1));
      }

      const services = Array.isArray(configuration.services) ? configuration.services : [];
      const saveService = db.prepare(`INSERT OR REPLACE INTO service_items
        (id, slug, title, description, icon, body, show_on_homepage, position,
         published, card_size)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      for (const record of services) {
        const slug = text(record, "slug").trim();
        if (slug) saveService.run(integer(record, "id"), slug, text(record, "title"), text(record, "description"), text(record, "icon"), text(record, "body"), integer(record, "show_on_homepage"), integer(record, "position"), integer(record, "published", 1), text(record, "card_size", "standard"));
      }

      const approachSteps = Array.isArray(configuration.approachSteps) ? configuration.approachSteps : [];
      const saveApproachStep = db.prepare(`INSERT OR REPLACE INTO approach_steps
        (id, title, description, icon, show_on_homepage, position, published)
        VALUES (?, ?, ?, ?, ?, ?, ?)`);
      for (const record of approachSteps) {
        const title = text(record, "title").trim();
        if (title) saveApproachStep.run(integer(record, "id"), title, text(record, "description"), text(record, "icon"), integer(record, "show_on_homepage"), integer(record, "position"), integer(record, "published", 1));
      }

      const aboutSections = Array.isArray(configuration.aboutSections) ? configuration.aboutSections : [];
      const saveAboutSection = db.prepare(`INSERT OR REPLACE INTO about_sections
        (key, eyebrow, headline, description, position, fixed, visible)
        VALUES (?, ?, ?, ?, ?, ?, ?)`);
      for (const record of aboutSections) {
        const key = text(record, "key").trim();
        if (key) saveAboutSection.run(key, text(record, "eyebrow"), text(record, "headline"), text(record, "description"), integer(record, "position"), integer(record, "fixed"), integer(record, "visible", 1));
      }

      const philosophyItems = Array.isArray(configuration.aboutPhilosophyItems) ? configuration.aboutPhilosophyItems : [];
      const savePhilosophyItem = db.prepare(`INSERT OR REPLACE INTO about_philosophy_items
        (id, title, description, icon, position, published)
        VALUES (?, ?, ?, ?, ?, ?)`);
      for (const record of philosophyItems) {
        const title = text(record, "title").trim();
        if (title) savePhilosophyItem.run(integer(record, "id"), title, text(record, "description"), text(record, "icon"), integer(record, "position"), integer(record, "published", 1));
      }

      const highlightItems = Array.isArray(configuration.aboutHighlightItems) ? configuration.aboutHighlightItems : [];
      const saveHighlightItem = db.prepare(`INSERT OR REPLACE INTO about_highlight_items
        (id, title, description, icon, position, published)
        VALUES (?, ?, ?, ?, ?, ?)`);
      for (const record of highlightItems) {
        const title = text(record, "title").trim();
        if (title) saveHighlightItem.run(integer(record, "id"), title, text(record, "description"), text(record, "icon"), integer(record, "position"), integer(record, "published", 1));
      }

      const upsertCaseStudy = db.prepare(
        `INSERT INTO case_studies
          (slug, eyebrow, title, description, tags, position, published, body,
           cover_image, thumbnail_image, category, year, outcome_eyebrow,
           outcome_title, metrics, assessment, password_required, password_hashes,
           author, published_at, meta_title, meta_description, meta_keywords,
           canonical_url, og_image, no_index)
         VALUES (${Array(26).fill("?").join(",")})
         ON CONFLICT(slug) DO UPDATE SET
          eyebrow=excluded.eyebrow, title=excluded.title, description=excluded.description,
          tags=excluded.tags, position=excluded.position, published=excluded.published,
          body=excluded.body, cover_image=excluded.cover_image,
          thumbnail_image=excluded.thumbnail_image, category=excluded.category,
          year=excluded.year, outcome_eyebrow=excluded.outcome_eyebrow,
          outcome_title=excluded.outcome_title, metrics=excluded.metrics,
          assessment=excluded.assessment, password_required=excluded.password_required,
          password_hashes=excluded.password_hashes, author=excluded.author,
          published_at=excluded.published_at, meta_title=excluded.meta_title,
          meta_description=excluded.meta_description, meta_keywords=excluded.meta_keywords,
          canonical_url=excluded.canonical_url, og_image=excluded.og_image,
          no_index=excluded.no_index`
      );
      for (const record of caseStudies) {
        const slug = text(record, "slug").trim();
        const title = text(record, "title").trim();
        if (!slug || !title) continue;
        upsertCaseStudy.run(
          slug, text(record, "eyebrow"), title, text(record, "description"),
          text(record, "tags"), integer(record, "position"), integer(record, "published", 1),
          text(record, "body"), text(record, "cover_image"), text(record, "thumbnail_image"),
          text(record, "category"), text(record, "year"), text(record, "outcome_eyebrow", "OUTCOMES"),
          text(record, "outcome_title"), list(record.metrics), list(record.assessment),
          integer(record, "password_required"), list(record.password_hashes),
          text(record, "author", "Andrei Stanescu"), text(record, "published_at"),
          text(record, "meta_title"), text(record, "meta_description"), text(record, "meta_keywords"),
          text(record, "canonical_url"), text(record, "og_image"), integer(record, "no_index")
        );
      }

      const upsertInsight = db.prepare(
        `INSERT INTO insights
          (slug, title, excerpt, body, published_at, scheduled_at, position, published,
           cover_image, thumbnail_image, category, author, tags, meta_title,
           meta_description, meta_keywords, canonical_url, og_image, no_index)
         VALUES (${Array(19).fill("?").join(",")})
         ON CONFLICT(slug) DO UPDATE SET
          title=excluded.title, excerpt=excluded.excerpt, body=excluded.body,
          published_at=excluded.published_at, scheduled_at=excluded.scheduled_at, position=excluded.position,
          published=excluded.published, cover_image=excluded.cover_image,
          thumbnail_image=excluded.thumbnail_image, category=excluded.category,
          author=excluded.author, tags=excluded.tags, meta_title=excluded.meta_title,
          meta_description=excluded.meta_description, meta_keywords=excluded.meta_keywords,
          canonical_url=excluded.canonical_url, og_image=excluded.og_image,
          no_index=excluded.no_index`
      );
      for (const record of insights) {
        const slug = text(record, "slug").trim();
        const title = text(record, "title").trim();
        if (!slug || !title) continue;
        upsertInsight.run(
          slug, title, text(record, "excerpt"), text(record, "body"),
          text(record, "published_at"), text(record, "scheduled_at"), integer(record, "position"), integer(record, "published", 1),
          text(record, "cover_image"), text(record, "thumbnail_image"), text(record, "category"),
          text(record, "author", "Andrei Stanescu"), text(record, "tags"),
          text(record, "meta_title"), text(record, "meta_description"), text(record, "meta_keywords"),
          text(record, "canonical_url"), text(record, "og_image"), integer(record, "no_index")
        );
      }

      const upsertPage = db.prepare(
        `INSERT INTO pages
          (slug, eyebrow, title, body, show_in_nav, visible, nav_label, position,
           meta_title, meta_description, meta_keywords, canonical_url, og_image, no_index)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(slug) DO UPDATE SET
          eyebrow=excluded.eyebrow, title=excluded.title, body=excluded.body,
          show_in_nav=excluded.show_in_nav, visible=excluded.visible,
          nav_label=excluded.nav_label, position=excluded.position,
          meta_title=excluded.meta_title, meta_description=excluded.meta_description,
          meta_keywords=excluded.meta_keywords, canonical_url=excluded.canonical_url,
          og_image=excluded.og_image, no_index=excluded.no_index`
      );
      for (const record of pages) {
        const slug = text(record, "slug").trim();
        const title = text(record, "title").trim();
        if (!slug || !title) continue;
        upsertPage.run(
          slug, text(record, "eyebrow"), title, text(record, "body"),
          integer(record, "show_in_nav"), integer(record, "visible", 1),
          text(record, "nav_label"), integer(record, "position"),
          text(record, "meta_title"), text(record, "meta_description"),
          text(record, "meta_keywords"), text(record, "canonical_url"),
          text(record, "og_image"), integer(record, "no_index")
        );
      }

      const upsertExperience = db.prepare(
        `INSERT INTO about_experiences
          (id, start_date, end_date, job_title, company_name, business_profile,
           description, position, published)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
          start_date=excluded.start_date, end_date=excluded.end_date,
          job_title=excluded.job_title, company_name=excluded.company_name,
          business_profile=excluded.business_profile, description=excluded.description,
          position=excluded.position, published=excluded.published`
      );
      for (const record of experiences) {
        const id = integer(record, "id");
        const jobTitle = text(record, "job_title").trim();
        if (!id || !jobTitle) continue;
        upsertExperience.run(
          id, text(record, "start_date"), text(record, "end_date"), jobTitle,
          text(record, "company_name"), text(record, "business_profile"),
          text(record, "description"), integer(record, "position"), integer(record, "published", 1)
        );
      }
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }

    return NextResponse.json({ imported: { caseStudies: caseStudies.length, insights: insights.length, pages: pages.length, experiences: experiences.length } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed.";
    return NextResponse.json({ error: `Import failed: ${message}` }, { status: 400 });
  }
}
