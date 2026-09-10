import { db } from "@/lib/db";
import { ukDateTimeValue } from "@/lib/dateUtils";

export type Insight = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover_image: string;
  thumbnail_image: string;
  published_at: string;
  scheduled_at: string;
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
  const now = ukDateTimeValue();
  return db
    .prepare(
      "SELECT * FROM insights WHERE published = 1 AND (scheduled_at = '' OR scheduled_at <= ?) ORDER BY position ASC, id ASC"
    )
    .all(now) as Insight[];
}

export function getInsightBySlug(slug: string): Insight | undefined {
  let normalizedSlug = slug;
  try {
    normalizedSlug = decodeURIComponent(slug);
  } catch {
    // Keep the original value; the query will safely return no match.
  }
  return db
    .prepare("SELECT * FROM insights WHERE slug = ? AND published = 1 AND (scheduled_at = '' OR scheduled_at <= ?)")
    .get(normalizedSlug, ukDateTimeValue()) as Insight | undefined;
}

// "Keep reading" on an article page — a fresh random sample (excluding the
// article itself) on every request, up to `count` articles.
export function getRandomInsights(excludeSlug: string, count: number): Insight[] {
  return db
    .prepare(
      "SELECT * FROM insights WHERE published = 1 AND (scheduled_at = '' OR scheduled_at <= ?) AND slug != ? ORDER BY RANDOM() LIMIT ?"
    )
    .all(ukDateTimeValue(), excludeSlug, count) as Insight[];
}
