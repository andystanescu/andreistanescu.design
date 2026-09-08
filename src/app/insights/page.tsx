import { Nav } from "@/components/Nav/Nav";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer/Footer";
import { RichContent } from "@/components/RichContent/RichContent";
import { getInsights } from "@/data/insights";
import { getPublishedPage } from "@/lib/pages";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { InsightsListing } from "@/components/insights/InsightsListing/InsightsListing";
import styles from "./insights.module.css";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const page = getPublishedPage("insights");
  return page ? pageMetadata(page, "/insights") : {};
}

export default function InsightsPage() {
  const page = getPublishedPage("insights");
  if (!page) notFound();
  const insights = getInsights();
  const plainInsights = insights.map((insight) => ({
    id: insight.id,
    slug: insight.slug,
    title: insight.title,
    excerpt: insight.excerpt,
    body: insight.body,
    cover_image: insight.cover_image,
    thumbnail_image: insight.thumbnail_image,
    published_at: insight.published_at,
    position: insight.position,
    published: insight.published,
    category: insight.category,
    author: insight.author,
    tags: insight.tags,
    meta_title: insight.meta_title,
    meta_description: insight.meta_description,
    meta_keywords: insight.meta_keywords,
    canonical_url: insight.canonical_url,
    og_image: insight.og_image,
    no_index: insight.no_index,
  }));

  return (
    <>
      <Nav />
      <main className={styles.main}>
        <section className={`container ${styles.hero}`}>
          <p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>{page.eyebrow}</p>
          <h1 className="display-small">{page.title}</h1>
          <div className={styles.heroDescription}><RichContent html={page.body} /></div>
        </section>

        {insights.length === 0 ? (
          <p className={`container body-default ${styles.empty}`} style={{ color: "var(--text-tertiary)" }}>
            No articles published yet — check back soon for the first one.
          </p>
        ) : (
          <div className="container"><InsightsListing insights={plainInsights} /></div>
        )}
      </main>
      <Footer />
    </>
  );
}
