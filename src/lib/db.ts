import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

// Use Node built-in SQLite with a configurable storage directory.
// No provider-specific runtime or native compilation is required.
const dataDir = process.env.DATA_DIR?.trim() || join(process.cwd(), "data");
if (!existsSync(/*turbopackIgnore: true*/ dataDir)) mkdirSync(/*turbopackIgnore: true*/ dataDir, { recursive: true });
const dbPath = join(dataDir, "conscept.db");

// Reuse one connection across hot-reloads in dev and across requests in
// prod (a fresh DatabaseSync per request would be wasteful and, for a
// file-backed db, unnecessary).
const globalForDb = globalThis as unknown as { __conscept_db?: DatabaseSync };

export const db = globalForDb.__conscept_db ?? new DatabaseSync(dbPath);
globalForDb.__conscept_db = db;

// Allow concurrent application workers to finish SQLite initialization.
db.exec("PRAGMA busy_timeout = 30000;");

function initializeDatabase() {
  // Next.js evaluates server modules in parallel while collecting page data.
  // Serialize schema migrations and seed data so multiple build workers cannot
  // pass the same existence check and then insert the same record.
  db.exec("BEGIN IMMEDIATE;");
  try {
    db.exec(`
  CREATE TABLE IF NOT EXISTS case_studies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    eyebrow TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    cover_image TEXT NOT NULL DEFAULT '',
    thumbnail_image TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0,
    published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    meta_title TEXT NOT NULL DEFAULT '',
    meta_description TEXT NOT NULL DEFAULT '',
    meta_keywords TEXT NOT NULL DEFAULT '',
    canonical_url TEXT NOT NULL DEFAULT '',
    og_image TEXT NOT NULL DEFAULT '',
    no_index INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    cover_image TEXT NOT NULL DEFAULT '',
    thumbnail_image TEXT NOT NULL DEFAULT '',
    published_at TEXT NOT NULL,
    scheduled_at TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0,
    published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    meta_title TEXT NOT NULL DEFAULT '',
    meta_description TEXT NOT NULL DEFAULT '',
    meta_keywords TEXT NOT NULL DEFAULT '',
    canonical_url TEXT NOT NULL DEFAULT '',
    og_image TEXT NOT NULL DEFAULT '',
    no_index INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin_recovery_tokens (
    token_hash TEXT PRIMARY KEY,
    expires_at INTEGER NOT NULL,
    used INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    newsletter INTEGER NOT NULL DEFAULT 0,
    emailed INTEGER NOT NULL DEFAULT 0,
    email_error TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    content_type TEXT NOT NULL,
    content_id TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT '',
    country TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pages (
    slug TEXT PRIMARY KEY,
    eyebrow TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    show_in_nav INTEGER NOT NULL DEFAULT 0,
    visible INTEGER NOT NULL DEFAULT 1,
    nav_label TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS homepage_sections (
    key TEXT PRIMARY KEY,
    eyebrow TEXT NOT NULL DEFAULT '',
    headline TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0,
    fixed INTEGER NOT NULL DEFAULT 0,
    cta_primary_label TEXT NOT NULL DEFAULT '',
    cta_primary_href TEXT NOT NULL DEFAULT '',
    cta_secondary_label TEXT NOT NULL DEFAULT '',
    cta_secondary_href TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS service_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    show_on_homepage INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL DEFAULT 0,
    published INTEGER NOT NULL DEFAULT 1,
    card_size TEXT NOT NULL DEFAULT 'standard',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS approach_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '',
    show_on_homepage INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL DEFAULT 0,
    published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS about_sections (
    key TEXT PRIMARY KEY,
    eyebrow TEXT NOT NULL DEFAULT '',
    headline TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0,
    fixed INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS about_philosophy_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0,
    published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS about_highlight_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0,
    published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS about_experiences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_date TEXT NOT NULL DEFAULT '',
    end_date TEXT NOT NULL DEFAULT '',
    job_title TEXT NOT NULL DEFAULT '',
    company_name TEXT NOT NULL DEFAULT '',
    business_profile TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0,
    published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Migrate columns added after the tables were first created (CREATE TABLE
// IF NOT EXISTS above only applies to brand-new databases).
function addColumnIfMissing(table: string, column: string, ddl: string) {
  const safeTable = table.replaceAll('"', '""');
  const columns = db.prepare(`PRAGMA table_info("${safeTable}")`).all() as {
    name: string;
  }[];
  if (!columns.some((c) => c.name === column)) {
    try {
      db.exec(`ALTER TABLE "${safeTable}" ADD COLUMN ${ddl}`);
    } catch (error) {
      // Parallel Next.js workers can pass the check before one worker adds
      // the column. In that case the migration is already complete.
      const message = error instanceof Error ? error.message : String(error);
      if (!/duplicate column name/i.test(message)) throw error;
    }
  }
}
addColumnIfMissing("case_studies", "body", "body TEXT NOT NULL DEFAULT ''");
addColumnIfMissing("analytics_events", "source", "source TEXT NOT NULL DEFAULT ''");
addColumnIfMissing("analytics_events", "country", "country TEXT NOT NULL DEFAULT ''");
addColumnIfMissing("case_studies", "category", "category TEXT NOT NULL DEFAULT ''");
addColumnIfMissing("case_studies", "year", "year TEXT NOT NULL DEFAULT ''");
addColumnIfMissing("case_studies", "outcome_eyebrow", "outcome_eyebrow TEXT NOT NULL DEFAULT 'OUTCOMES'");
addColumnIfMissing("case_studies", "outcome_title", "outcome_title TEXT NOT NULL DEFAULT ''");
addColumnIfMissing("case_studies", "metrics", "metrics TEXT NOT NULL DEFAULT '[]'");
addColumnIfMissing("case_studies", "assessment", "assessment TEXT NOT NULL DEFAULT '{}'");
addColumnIfMissing("case_studies", "password_required", "password_required INTEGER NOT NULL DEFAULT 0");
addColumnIfMissing("case_studies", "password_hashes", "password_hashes TEXT NOT NULL DEFAULT '[]'");
addColumnIfMissing("case_studies", "author", "author TEXT NOT NULL DEFAULT 'Andrei Stanescu'");
addColumnIfMissing("case_studies", "published_at", "published_at TEXT NOT NULL DEFAULT ''");
addColumnIfMissing("case_studies", "meta_title", "meta_title TEXT NOT NULL DEFAULT ''");
addColumnIfMissing("case_studies", "meta_description", "meta_description TEXT NOT NULL DEFAULT ''");
addColumnIfMissing("case_studies", "meta_keywords", "meta_keywords TEXT NOT NULL DEFAULT ''");
addColumnIfMissing("case_studies", "canonical_url", "canonical_url TEXT NOT NULL DEFAULT ''");
addColumnIfMissing("case_studies", "og_image", "og_image TEXT NOT NULL DEFAULT ''");
addColumnIfMissing("case_studies", "no_index", "no_index INTEGER NOT NULL DEFAULT 0");
addColumnIfMissing(
  "case_studies",
  "cover_image",
  "cover_image TEXT NOT NULL DEFAULT ''"
);
addColumnIfMissing(
  "case_studies",
  "thumbnail_image",
  "thumbnail_image TEXT NOT NULL DEFAULT ''"
);
addColumnIfMissing(
  "insights",
  "cover_image",
  "cover_image TEXT NOT NULL DEFAULT ''"
);
addColumnIfMissing(
  "insights",
  "thumbnail_image",
  "thumbnail_image TEXT NOT NULL DEFAULT ''"
);
addColumnIfMissing("insights", "scheduled_at", "scheduled_at TEXT NOT NULL DEFAULT ''");
addColumnIfMissing("insights", "category", "category TEXT NOT NULL DEFAULT ''");
addColumnIfMissing("insights", "tags", "tags TEXT NOT NULL DEFAULT ''");
addColumnIfMissing(
  "insights",
  "author",
  "author TEXT NOT NULL DEFAULT 'Andrei Stanescu'"
);
addColumnIfMissing("insights", "meta_title", "meta_title TEXT NOT NULL DEFAULT ''");
addColumnIfMissing("insights", "meta_description", "meta_description TEXT NOT NULL DEFAULT ''");
addColumnIfMissing("insights", "meta_keywords", "meta_keywords TEXT NOT NULL DEFAULT ''");
addColumnIfMissing("insights", "canonical_url", "canonical_url TEXT NOT NULL DEFAULT ''");
addColumnIfMissing("insights", "og_image", "og_image TEXT NOT NULL DEFAULT ''");
addColumnIfMissing("insights", "no_index", "no_index INTEGER NOT NULL DEFAULT 0");
addColumnIfMissing(
  "pages",
  "show_in_nav",
  "show_in_nav INTEGER NOT NULL DEFAULT 0"
);
addColumnIfMissing("pages", "visible", "visible INTEGER NOT NULL DEFAULT 1");
addColumnIfMissing("pages", "meta_title", "meta_title TEXT NOT NULL DEFAULT ''");
addColumnIfMissing("pages", "meta_description", "meta_description TEXT NOT NULL DEFAULT ''");
addColumnIfMissing("pages", "meta_keywords", "meta_keywords TEXT NOT NULL DEFAULT ''");
addColumnIfMissing("pages", "canonical_url", "canonical_url TEXT NOT NULL DEFAULT ''");
addColumnIfMissing("pages", "og_image", "og_image TEXT NOT NULL DEFAULT ''");
addColumnIfMissing("pages", "no_index", "no_index INTEGER NOT NULL DEFAULT 0");
addColumnIfMissing("service_items", "card_size", "card_size TEXT NOT NULL DEFAULT 'standard'");
addColumnIfMissing("pages", "nav_label", "nav_label TEXT NOT NULL DEFAULT ''");
addColumnIfMissing("pages", "position", "position INTEGER NOT NULL DEFAULT 0");
addColumnIfMissing(
  "homepage_sections",
  "cta_primary_label",
  "cta_primary_label TEXT NOT NULL DEFAULT ''"
);
addColumnIfMissing(
  "homepage_sections",
  "cta_primary_href",
  "cta_primary_href TEXT NOT NULL DEFAULT ''"
);
addColumnIfMissing(
  "homepage_sections",
  "cta_secondary_label",
  "cta_secondary_label TEXT NOT NULL DEFAULT ''"
);
addColumnIfMissing(
  "homepage_sections",
  "cta_secondary_href",
  "cta_secondary_href TEXT NOT NULL DEFAULT ''"
);
addColumnIfMissing("homepage_sections", "visible", "visible INTEGER NOT NULL DEFAULT 1");
addColumnIfMissing("about_sections", "visible", "visible INTEGER NOT NULL DEFAULT 1");

const DEFAULT_SETTINGS: Record<string, string> = {
  logo_identity: "personal",
  work_outcome_title: "Better systems make better work repeatable.",
  work_outcome_body: "Clarity compounds: decisions become easier, teams move with more confidence and products improve over time.",
  confirmation_title: "Thanks — message received.",
  confirmation_body: "I reply within two working days.",
  contact_email_to: "",
  logo_image: "",
  about_hero_image: "",
  about_cv: "",
};

// Content snapshots are imported explicitly through the admin panel.
// Startup never restores an exported snapshot over intentionally empty tables.

const getSettingStmt = db.prepare("SELECT value FROM settings WHERE key = ?");
const insertSettingStmt = db.prepare(
  "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)"
);
for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
  if (!getSettingStmt.get(key)) insertSettingStmt.run(key, value);
}

// One-time seed from the site's original static data files, so the admin
// panel starts with real content instead of an empty database. Only runs
// while those tables are still empty.
const caseStudyCount = db
  .prepare("SELECT COUNT(*) AS n FROM case_studies")
  .get() as { n: number };
if (caseStudyCount.n === 0) {
  const insert = db.prepare(
    `INSERT INTO case_studies (slug, eyebrow, title, description, tags, position, published)
     VALUES (?, ?, ?, ?, ?, ?, 1)`
  );
  const seedCaseStudies = [
    {
      slug: "fintech-design-system-foundations",
      eyebrow: "Featured case study",
      title: "Design system foundations for a global fintech platform",
      tags: "Strategy · Design Systems · Governance",
      description:
        "Created a shared product language across teams, reducing duplication and giving delivery teams a clearer path from idea to release.",
    },
    {
      slug: "saas-operating-model",
      eyebrow: "Product Architecture",
      title: "A clearer operating model for a scaling SaaS team",
      tags: "",
      description:
        "Mapped the information, flows and structures behind a fast-growing SaaS product, giving every team a shared model to build against.",
    },
    {
      slug: "ai-design-ops-consistency",
      eyebrow: "AI-Enabled Design Ops",
      title: "More consistent decisions across a growing product org",
      tags: "",
      description:
        "Introduced AI-assisted workflows on top of existing design tokens and governance, cutting review cycles without loosening quality.",
    },
  ];
  seedCaseStudies.forEach((study, index) => {
    insert.run(
      study.slug,
      study.eyebrow,
      study.title,
      study.description,
      study.tags,
      index
    );
  });
}

const insightCount = db.prepare("SELECT COUNT(*) AS n FROM insights").get() as {
  n: number;
};
if (insightCount.n === 0) {
  db.prepare(
    `INSERT INTO insights (slug, title, excerpt, body, published_at, position, published, category, author)
     VALUES (?, ?, ?, ?, ?, 0, 1, ?, ?)`
  ).run(
    "foundations-over-components",
    "Foundations over components: Why design systems fail without them",
    "Why most design systems struggle to scale — and what strong foundations look like in practice.",
    "",
    "August 2026",
    "Design Systems",
    "Andrei Stanescu"
  );
}

// Every real page on the site (excluding the homepage — a composed
// marketing layout, not a simple eyebrow/title/body page — and case
// study / article detail pages, which are their own CMS). Each row is
// seeded once with the site's original copy so nothing regresses until
// an admin edits it in /admin/pages. show_in_nav/position give these
// pages control over the main nav directly, instead of a separate
// freeform link list in Settings.
const SEED_PAGES = [
  {
    slug: "work",
    eyebrow: "work",
    title: "Work",
    body: "<p>A selection of the systems we've built with clients.</p>",
    showInNav: 1,
    position: 0,
  },
  {
    slug: "services",
    eyebrow: "services",
    title: "Services",
    body: "<p>A full breakdown of our services is coming soon. In the meantime, see an overview on the homepage.</p>",
    showInNav: 1,
    position: 1,
  },
  {
    slug: "approach",
    eyebrow: "approach",
    title: "Approach",
    body: "<p>A deeper look at our five-stage approach is coming soon. See the overview on the homepage.</p>",
    showInNav: 1,
    position: 2,
  },
  {
    slug: "insights",
    eyebrow: "insights",
    title: "Insights",
    body: "<p>Writing on design systems, product architecture, and AI-enabled design operations.</p>",
    showInNav: 1,
    position: 3,
  },
  {
    slug: "about",
    eyebrow: "about",
    title: "About",
    body: "<p>More about ConScept and the people behind it is coming soon.</p>",
    showInNav: 1,
    position: 4,
  },
  {
    slug: "contact",
    eyebrow: "let's talk",
    title: "Start a conversation.",
    body: "<p>Whether you are starting from nothing or untangling something that grew too fast.</p>",
    showInNav: 0,
    position: 5,
  },
  {
    slug: "privacy",
    eyebrow: "legal",
    title: "Privacy Policy",
    body: "<p>Our privacy policy is coming soon.</p>",
    showInNav: 0,
    position: 6,
  },
  {
    slug: "terms",
    eyebrow: "legal",
    title: "Terms of Service",
    body: "<p>Our terms of service are coming soon.</p>",
    showInNav: 0,
    position: 7,
  },
];
const insertPageStmt = db.prepare(
  `INSERT INTO pages (slug, eyebrow, title, body, show_in_nav, position)
   VALUES (?, ?, ?, ?, ?, ?)`
);
const getPageStmt = db.prepare("SELECT slug FROM pages WHERE slug = ?");
for (const page of SEED_PAGES) {
  if (!getPageStmt.get(page.slug)) {
    insertPageStmt.run(
      page.slug,
      page.eyebrow,
      page.title,
      page.body,
      page.showInNav,
      page.position
    );
  }
}

// One-time backfill: services/approach/about already existed (from before
// nav control lived on pages) with show_in_nav still at its column
// default (0). Give them the nav visibility/order the site originally
// shipped with. Guarded by a migration marker rather than "is anything
// currently in the nav" — work/insights are inserted with show_in_nav=1
// above on a fresh DB, which would otherwise make that check look
// satisfied before services/approach/about ever got fixed up, and would
// also re-apply on every restart and fight a deliberate later toggle-off.
if (!getSettingStmt.get("_migrated_legacy_nav_pages")) {
  const setNav = db.prepare(
    "UPDATE pages SET show_in_nav = 1, position = ? WHERE slug = ?"
  );
  ["work", "services", "approach", "insights", "about"].forEach(
    (slug, index) => setNav.run(index, slug)
  );
  insertSettingStmt.run("_migrated_legacy_nav_pages", "1");
}

// Homepage sections. Nav, Hero, and Footer are position-fixed by design
// (Hero is still text-editable, just not reorderable); the rest can be
// reordered from /admin/homepage. #word# in headline/description accents
// that word orange, same convention as page bodies.
const SEED_HOMEPAGE_SECTIONS = [
  {
    key: "hero",
    eyebrow: "",
    headline: "Great products emerge from #strong foundations.#",
    description:
      "We help technology companies build the systems behind their products. Strategic. Scalable. Enduring.",
    position: -1,
    fixed: 1,
  },
  {
    key: "services",
    eyebrow: "",
    headline: "We design the foundations. You build the #future.#",
    description: "",
    position: 0,
    fixed: 0,
  },
  {
    key: "approach",
    eyebrow: "our approach",
    headline: "From foundations to impact.",
    description:
      "A clear approach that connects strategy, systems and execution to create products that scale and endure.",
    position: 1,
    fixed: 0,
  },
  {
    key: "selected_impact",
    eyebrow: "selected impact",
    headline: "Foundations in practice.",
    description:
      "A few examples of how stronger systems create better products and healthier teams.",
    position: 2,
    fixed: 0,
  },
  {
    key: "latest_insights",
    eyebrow: "latest insights",
    headline: "Ideas for stronger products and teams.",
    description: "",
    position: 3,
    fixed: 0,
  },
  {
    key: "before_conscept",
    eyebrow: "Before ConScept",
    headline: "Experience that shaped how I work.",
    description: "The roles and environments that taught me to look beyond the immediate problem.",
    position: 4,
    fixed: 0,
  },
];
const insertSectionStmt = db.prepare(
  `INSERT INTO homepage_sections (key, eyebrow, headline, description, position, fixed)
   VALUES (?, ?, ?, ?, ?, ?)`
);
const getSectionStmt = db.prepare(
  "SELECT key FROM homepage_sections WHERE key = ?"
);
for (const section of SEED_HOMEPAGE_SECTIONS) {
  if (!getSectionStmt.get(section.key)) {
    insertSectionStmt.run(
      section.key,
      section.eyebrow,
      section.headline,
      section.description,
      section.position,
      section.fixed
    );
  }
}

// One-time backfill for the hero CTA buttons (columns added after "hero"
// may already exist as a row).
if (!getSettingStmt.get("_migrated_hero_ctas")) {
  db.prepare(
    `UPDATE homepage_sections
     SET cta_primary_label = ?, cta_primary_href = ?, cta_secondary_label = ?, cta_secondary_href = ?
     WHERE key = 'hero'`
  ).run("Explore our approach", "/approach", "See our work", "/work");
  insertSettingStmt.run("_migrated_hero_ctas", "1");
}

// Services shown on the homepage's Services section and listed on the
// /services page — an admin-editable list instead of a static file, same
// pattern as case studies. show_on_homepage controls whether a given
// service also appears in the homepage grid.
const SEED_SERVICE_ITEMS = [
  {
    slug: "design-systems",
    icon: "/assets/mark-design-systems.svg",
    title: "Design Systems",
    description: "Scalable systems that create consistency and accelerate teams.",
  },
  {
    slug: "product-architecture",
    icon: "/assets/mark-product-architecture.svg",
    title: "Product Architecture",
    description: "Information, flows and structures that enable clarity and growth.",
  },
  {
    slug: "ai-enabled-design-operations",
    icon: "/assets/mark-ai-design-ops.svg",
    title: "AI-Enabled Design Operations",
    description:
      "Integrating AI into workflows to unlock efficiency without losing quality.",
  },
  {
    slug: "governance-scale",
    icon: "/assets/mark-governance-scale.svg",
    title: "Governance & Scale",
    description: "Rules, processes and alignment that keep systems healthy over time.",
  },
  {
    slug: "collaboration-alignment",
    icon: "/assets/mark-collaboration-alignment.svg",
    title: "Collaboration & Alignment",
    description:
      "Bringing design, engineering and product together around shared foundations.",
  },
];
const insertServiceItemStmt = db.prepare(
  `INSERT INTO service_items (slug, title, description, icon, show_on_homepage, position, published)
   VALUES (?, ?, ?, ?, 1, ?, 1)`
);
const getServiceItemStmt = db.prepare(
  "SELECT slug FROM service_items WHERE slug = ?"
);
// Seed the built-in services only for a genuinely empty database. Re-adding
// any missing seed row on every app start makes an intentional admin deletion
// appear to undo itself after a restart or hot reload.
const serviceCount = db
  .prepare("SELECT COUNT(*) AS count FROM service_items")
  .get() as { count: number };
if (serviceCount.count === 0) {
  SEED_SERVICE_ITEMS.forEach((item, index) => {
    if (!getServiceItemStmt.get(item.slug)) {
      insertServiceItemStmt.run(
        item.slug,
        item.title,
        item.description,
        item.icon,
        index
      );
    }
  });
}

// Approach steps shown on the homepage's Approach section and listed on
// the /approach page — same admin-editable pattern as services.
const SEED_APPROACH_STEPS = [
  {
    icon: "/assets/process-icon-01.svg",
    title: "Understand the foundations",
    description:
      "We uncover the principles, needs and constraints that define long-term success.",
  },
  {
    icon: "/assets/process-icon-02.svg",
    title: "Architect the system",
    description:
      "We design the structure, relationships and rules that will guide every decision.",
  },
  {
    icon: "/assets/process-icon-03.svg",
    title: "Build the components",
    description: "We create the pieces that fit the system, not the other way around.",
  },
  {
    icon: "/assets/process-icon-04.svg",
    title: "Enable the teams",
    description:
      "We document, educate and align teams to adopt and evolve the system.",
  },
  {
    icon: "/assets/process-icon-05.svg",
    title: "Create lasting impact",
    description: "The system scales. Products improve. Users benefit. Businesses grow.",
  },
];
const approachStepCount = db
  .prepare("SELECT COUNT(*) AS n FROM approach_steps")
  .get() as { n: number };
if (approachStepCount.n === 0) {
  const insertStep = db.prepare(
    `INSERT INTO approach_steps (title, description, icon, show_on_homepage, position, published)
     VALUES (?, ?, ?, 1, ?, 1)`
  );
  SEED_APPROACH_STEPS.forEach((step, index) => {
    insertStep.run(step.title, step.description, step.icon, index);
  });
}

// About page — same reorderable-sections pattern as the homepage (Hero
// fixed, the rest reorderable), plus two item lists (Philosophy,
// Highlights) editable the same way as Services / Approach steps.
const SEED_ABOUT_SECTIONS = [
  {
    key: "hero",
    eyebrow: "About me",
    headline: "For years I thought I was designing products.",
    description:
      "Eventually I realised I was designing the systems that make great products possible. That realization changed the way I approach every project.",
    position: -1,
    fixed: 1,
  },
  {
    key: "drives_me",
    eyebrow: "",
    headline: "What drives me",
    description: "These are operating principles that influence every engagement.",
    position: 0,
    fixed: 0,
  },
  {
    key: "philosophy",
    eyebrow: "My Philosophy",
    headline: "Products improve when the systems behind them improve.",
    description:
      "I don't define my work by the artefacts I create. I define it by the systems I help improve. Through years of working with product teams, I realised that great products aren't built by chance. They emerge from well-designed systems, thoughtful decisions and organisations that continuously learn.",
    position: 1,
    fixed: 0,
  },
  {
    key: "highlights",
    eyebrow: "",
    headline: "Building systems for lasting impact.",
    description:
      "Throughout my career, I've found that the most valuable solutions rarely come from solving the visible problem. They come from understanding the system that created it. That's why my work combines systems thinking, product design and organisational understanding to help companies solve complex challenges at their root.",
    position: 2,
    fixed: 0,
  },
  {
    key: "latest_insights",
    eyebrow: "latest insights",
    headline: "Ideas for stronger products and teams.",
    description: "",
    position: 3,
    fixed: 0,
  },
];
const insertAboutSectionStmt = db.prepare(
  `INSERT INTO about_sections (key, eyebrow, headline, description, position, fixed)
   VALUES (?, ?, ?, ?, ?, ?)`
);
const getAboutSectionStmt = db.prepare(
  "SELECT key FROM about_sections WHERE key = ?"
);
for (const section of SEED_ABOUT_SECTIONS) {
  if (!getAboutSectionStmt.get(section.key)) {
    insertAboutSectionStmt.run(
      section.key,
      section.eyebrow,
      section.headline,
      section.description,
      section.position,
      section.fixed
    );
  }
}
if (!getAboutSectionStmt.get("before_conscept")) {
  insertAboutSectionStmt.run(
    "before_conscept",
    "Before ConScept",
    "Experience that shaped how I work.",
    "The roles and environments that taught me to look beyond the immediate problem.",
    4,
    0
  );
}

const SEED_PHILOSOPHY_ITEMS = [
  {
    icon: "/assets/about-philosophy-icon-01.svg",
    title: "Great Products Emerge",
    description:
      "We don't believe great products are created through isolated moments of brilliance. They emerge naturally when business goals, user needs, engineering, accessibility and governance work together as a coherent system.",
  },
  {
    icon: "/assets/about-philosophy-icon-02.svg",
    title: "Systems Over Artifacts",
    description:
      "Components, documentation, governance and AI are not the objective. They are expressions of a larger system. We focus on improving the system first, because strong systems naturally produce better outcomes.",
  },
  {
    icon: "/assets/about-philosophy-icon-03.svg",
    title: "Evolution Is Inevitable",
    description:
      "Every organisation changes. Teams grow, products mature and priorities shift. Rather than resisting change, we design systems that preserve clarity while allowing organisations to evolve with confidence.",
  },
  {
    icon: "/assets/about-philosophy-icon-04.svg",
    title: "Knowledge Should Compound",
    description:
      "Every project teaches an organisation something. That knowledge shouldn't disappear when people move teams or leave the company. We help transform experience into shared organisational knowledge that improves every future decision.",
  },
];
const philosophyItemCount = db
  .prepare("SELECT COUNT(*) AS n FROM about_philosophy_items")
  .get() as { n: number };
if (philosophyItemCount.n === 0) {
  const insertItem = db.prepare(
    `INSERT INTO about_philosophy_items (title, description, icon, position, published)
     VALUES (?, ?, ?, ?, 1)`
  );
  SEED_PHILOSOPHY_ITEMS.forEach((item, index) => {
    insertItem.run(item.title, item.description, item.icon, index);
  });
}

const SEED_HIGHLIGHT_ITEMS = [
  {
    icon: "/assets/about-highlight-icon-01.svg",
    title: "Systems Thinker",
    description:
      "I approach every challenge by understanding the relationships behind it. Rather than treating symptoms, I uncover the underlying systems that shape products, teams and organisations.",
  },
  {
    icon: "/assets/about-highlight-icon-02.svg",
    title: "Partners in Problem Solving",
    description:
      "I don't arrive with predetermined solutions. I work alongside product, design and engineering teams to understand the challenge, question assumptions and build solutions that fit the organisation rather than forcing a generic framework onto it.",
  },
  {
    icon: "/assets/about-highlight-icon-03.svg",
    title: "Focused on Lasting Impact",
    description:
      "My objective isn't to leave behind more documentation or more components. It's to leave organisations with stronger reasoning, clearer principles and systems that continue improving long after our engagement ends.",
  },
];
const highlightItemCount = db
  .prepare("SELECT COUNT(*) AS n FROM about_highlight_items")
  .get() as { n: number };
if (highlightItemCount.n === 0) {
  const insertHighlight = db.prepare(
    `INSERT INTO about_highlight_items (title, description, icon, position, published)
     VALUES (?, ?, ?, ?, 1)`
  );
  SEED_HIGHLIGHT_ITEMS.forEach((item, index) => {
    insertHighlight.run(item.title, item.description, item.icon, index);
  });
}

// Complete the original demo articles once so every seeded article exercises
// the full public article layout. The exact-body guard protects later edits.
const articleBodyBackfills: Record<string, { current: string; next: (image: string) => string }> = {
  "Outlive System": {
    current: "<p>Where AI helps design teams move faster without replacing judgment.</p>",
    next: (image) =>
      `<p>A design system should make good decisions easier to repeat, even when the people who made them first have moved on.</p>` +
      `<h2>The real reason systems fail</h2><p>It is tempting to start with components because they are tangible. Without shared principles, they become local answers rather than a coherent product language.</p>` +
      `<blockquote><p>A design system is not a component library. It is an operating system for your product.</p></blockquote>` +
      `<h2>Components are the output, not the starting point</h2><p>Foundations connect design, engineering, accessibility and governance around the same intent.</p>` +
      `<pre><code>const system = { foundations: true, components: "output", consistency: "repeatable" };</code></pre>` +
      `<figure><img src="${image}" alt="A visual map of a connected design system" /><figcaption>The system becomes more resilient when its relationships are visible.</figcaption></figure>` +
      `<h2>What strong foundations actually include</h2><p>Principles, tokens, ownership, contribution paths and feedback loops turn delivery into knowledge that compounds.</p>`,
  },
  Creativity: {
    current: "<p>A practical look at the layers, roles and decisions that make a design system scale.</p>",
    next: (image) =>
      `<p>Creativity rarely disappears. More often, it gets crowded out by familiarity, deadlines and the pressure to already know the answer.</p>` +
      `<h2>Why becoming a beginner helps</h2><p>When I was seventeen, I joined an activity where I had no useful prior experience. The awkwardness was productive: I noticed more, asked better questions and stopped protecting the first idea.</p>` +
      `<blockquote><p>Beginner energy is not a lack of expertise. It is the willingness to look again.</p></blockquote>` +
      `<h2>Designing with curiosity</h2><p>Instead of jumping to the familiar pattern, make room to understand the problem, test assumptions and let the system reveal what it needs.</p>` +
      `<pre><code>const brief = { assumptions: "visible", questions: "open", nextStep: "learn" };</code></pre>` +
      `<figure><img src="${image}" alt="A visual metaphor for exploring a new world" /><figcaption>New perspectives create better questions before better answers.</figcaption></figure>` +
      `<h2>Make room for the unfamiliar</h2><p>Small experiments can restart the process: change the reference, invite an unexpected voice or alter the order of the work.</p>`,
  },
  "Interview Bias": {
    current: "<p>This is a short intro paragraph that sets up the article before the first section begins.</p><h2>The first big idea</h2><p>A paragraph explaining the first idea in a bit more depth, with enough words to make the reading time calculation meaningful. Repeating a bit more filler content here so the word count is realistic for a short article and the estimate lands on a sensible number of minutes rather than rounding to the same one-minute floor every time.</p><h2>Wrapping things up</h2><p>A closing paragraph that ties everything together and gives the reader a clear takeaway.</p>",
    next: (image) =>
      `<p>The people who respond to a survey are not always the people carrying the greatest cost of a product decision. That gap is where useful research can disappear.</p>` +
      `<h2>The first big idea</h2><p>Feedback is shaped by who has the time, confidence and motivation to provide it. A quiet user may still be deeply affected by the product.</p>` +
      `<blockquote><p>The absence of feedback is not evidence of the absence of a problem.</p></blockquote>` +
      `<h2>Look for the people who adapted around the product</h2><p>Workarounds, informal guidance and feature avoidance reveal where intended and lived experiences have drifted apart.</p>` +
      `<pre><code>const researchSample = { respondents: "visible", nonRespondents: "considered", bias: "discussed" };</code></pre>` +
      `<figure><img src="${image}" alt="A research framework showing connected decisions" /><figcaption>Good research makes the edges of the sample visible.</figcaption></figure>` +
      `<h2>Wrapping things up</h2><p>Strong research is not only about collecting more answers. It is about understanding who is missing and what they have adapted to.</p>`,
  },
};

const updateArticleBody = db.prepare(
  "UPDATE insights SET body = ? WHERE slug = ? AND body = ?"
);
for (const article of db
  .prepare("SELECT slug, body, cover_image FROM insights")
  .all() as { slug: string; body: string; cover_image: string }[]) {
  const backfill = articleBodyBackfills[article.slug];
  if (backfill && article.body === backfill.current) {
    updateArticleBody.run(backfill.next(article.cover_image), article.slug, backfill.current);
  }
}

    db.exec("COMMIT;");
  } catch (error) {
    try {
      db.exec("ROLLBACK;");
    } catch {
      // The original initialization error is the useful failure to report.
    }
    throw error;
  }
}

initializeDatabase();
