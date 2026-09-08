import { db } from "@/lib/db";

export type Page = {
  slug: string;
  eyebrow: string;
  title: string;
  body: string;
  show_in_nav: number;
  visible: number;
  nav_label: string;
  position: number;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  canonical_url: string;
  og_image: string;
  no_index: number;
};

export function getPage(slug: string): Page | undefined {
  return db.prepare("SELECT * FROM pages WHERE slug = ?").get(slug) as
    | Page
    | undefined;
}

export function getPublishedPage(slug: string): Page | undefined {
  return db.prepare("SELECT * FROM pages WHERE slug = ? AND visible = 1").get(slug) as
    | Page
    | undefined;
}

export function getAllPages(): Page[] {
  return db.prepare("SELECT * FROM pages ORDER BY position ASC").all() as Page[];
}

// Work, Services, Approach, Insights, and About each have their own
// dedicated admin section — their nav-order controls live there now (each
// section's "Page settings" tab), not in the generic /admin/pages list.
// Kept here (not just in the page component) so movePagePosition below
// reorders against the same subset the list actually displays.
export const RELOCATED_PAGE_SLUGS = new Set([
  "work",
  "services",
  "approach",
  "insights",
  "about",
]);

export function getGenericPages(): Page[] {
  return getAllPages().filter((p) => !RELOCATED_PAGE_SLUGS.has(p.slug));
}

// The public header uses every page that opts into the main navigation. Keep
// this as the shared source for the admin ordering screen so the order shown
// there is exactly the order visitors receive.
export function getMainNavPages(): Page[] {
  return getAllPages().filter((p) => p.show_in_nav === 1);
}

export function updatePage(
  slug: string,
  update: {
    eyebrow: string;
    title: string;
    body: string;
    showInNav: boolean;
    visible: boolean;
    navLabel: string;
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    canonicalUrl: string;
    ogImage: string;
    noIndex: boolean;
  }
) {
  db.prepare(
    `UPDATE pages
     SET eyebrow = ?, title = ?, body = ?, show_in_nav = ?, nav_label = ?, visible = ?, meta_title = ?, meta_description = ?, meta_keywords = ?, canonical_url = ?, og_image = ?, no_index = ?
     WHERE slug = ?`
  ).run(
    update.eyebrow,
    update.title,
    update.body,
    update.showInNav ? 1 : 0,
    update.navLabel,
    update.visible ? 1 : 0,
    update.metaTitle,
    update.metaDescription,
    update.metaKeywords,
    update.canonicalUrl,
    update.ogImage,
    update.noIndex ? 1 : 0,
    slug
  );
}

// Reordering only ever applies within the nav-visible subset of the
// generic Pages list — the up/down arrows in /admin/pages only appear for
// pages currently shown in the nav there, so swap against that subset's
// neighbor (excluding the relocated slugs, which order themselves via
// their own section instead), not the full table's.
export function movePagePosition(slug: string, direction: "up" | "down") {
  const navPages = getGenericPages().filter((p) => p.show_in_nav);
  const index = navPages.findIndex((p) => p.slug === slug);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= navPages.length) return;

  const current = navPages[index];
  const swapWith = navPages[swapIndex];
  const update = db.prepare("UPDATE pages SET position = ? WHERE slug = ?");
  update.run(swapWith.position, current.slug);
  update.run(current.position, swapWith.slug);
}

export type NavLink = { label: string; href: string };

// The main nav is driven directly by each page's "show in nav" toggle and
// position (set in /admin/pages), not a separate freeform link list.
export function getNavLinks(): NavLink[] {
  const pages = db
    .prepare(
      "SELECT slug, title, nav_label FROM pages WHERE show_in_nav = 1 AND visible = 1 ORDER BY position ASC"
    )
    .all() as Pick<Page, "slug" | "title" | "nav_label">[];
  return pages.filter((p) => p.slug !== "approach").map((p) => ({
    label: p.nav_label || p.title,
    href: `/${p.slug}`,
  }));
}
