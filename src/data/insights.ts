import { db } from "@/lib/db";

export type Insight = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover_image: string;
  thumbnail_image: string;
  published_at: string;
  position: number;
  published: number;
  category: string;
  author: string;
  tags: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  canonical_url: string;
  og_image: string;
  no_index: number;
};

// Order = recency/curation via `position` — the first entry is the one
// featured on the homepage. Managed entirely from /admin/insights; an empty
// result hides "Latest Insights" and shows an empty state on /insights.
export function getInsights(): Insight[] {
  return db
    .prepare(
      "SELECT * FROM insights WHERE published = 1 ORDER BY position ASC, id ASC"
    )
    .all() as Insight[];
}

export function getInsightBySlug(slug: string): Insight | undefined {
  let normalizedSlug = slug;
  try {
    normalizedSlug = decodeURIComponent(slug);
  } catch {
    // Keep the original value; the query will safely return no match.
  }
  return db
    .prepare("SELECT * FROM insights WHERE slug = ? AND published = 1")
    .get(normalizedSlug) as Insight | undefined;
}

// "Keep reading" on an article page — a fresh random sample (excluding the
// article itself) on every request, up to `count` articles.
export function getRandomInsights(excludeSlug: string, count: number): Insight[] {
  return db
    .prepare(
      "SELECT * FROM insights WHERE published = 1 AND slug != ? ORDER BY RANDOM() LIMIT ?"
    )
    .all(excludeSlug, count) as Insight[];
}
