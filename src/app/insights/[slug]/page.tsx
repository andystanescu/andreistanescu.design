import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav/Nav";
import { Footer } from "@/components/Footer/Footer";
import { RichContent } from "@/components/RichContent/RichContent";
import { ArticlePreview } from "@/components/insights/ArticlePreview/ArticlePreview";
import { getInsightBySlug, getRandomInsights } from "@/data/insights";
import { addHeadingIds } from "@/lib/tableOfContents";
import { TableOfContents } from "@/components/TableOfContents/TableOfContents";
import { calculateReadingTime } from "@/lib/readingTime";
import styles from "./insight.module.css";
import { contentMetadata, absoluteUrl } from "@/lib/seo";
import { displayCompactDate } from "@/lib/dateUtils";
import { ContentViewTracker } from "@/components/ContentViewTracker/ContentViewTracker";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { getRelatedReadingReferences } from "@/lib/interactiveBlocks";
import { RelatedReadingList } from "@/components/RelatedReadingList/RelatedReadingList";
import { resolveRelatedReadings } from "@/lib/relatedReadings";
import { ArticleHero } from "@/components/insights/ArticleHero/ArticleHero";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const insight = getInsightBySlug(slug);
  if (!insight) return {};
  return contentMetadata({ title: insight.meta_title || `${insight.title} | Andrei Stanescu`, description: insight.meta_description || insight.excerpt, path: `/insights/${encodeURIComponent(insight.slug)}`, image: insight.og_image || insight.thumbnail_image || insight.cover_image, keywords: insight.meta_keywords, canonicalUrl: insight.canonical_url || undefined, noIndex: Boolean(insight.no_index) });
}

export default async function InsightDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ preview?: string }>;
}) {
  const { slug } = await params;
  const query = searchParams ? await searchParams : {};
  const cookieStore = await cookies();
  const preview = query.preview === "1" && verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  const insight = getInsightBySlug(slug, preview);

  if (!insight) {
    notFound();
  }

  const { html: bodyHtml, toc } = addHeadingIds(insight.body);
  const relatedReadings = resolveRelatedReadings(getRelatedReadingReferences(insight.body));
  const readingMinutes = calculateReadingTime(insight.body);
  const moreArticles = getRandomInsights(insight.slug, 3);

  return (
    <>
      {!preview && <ContentViewTracker contentType="article" contentId={insight.slug} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "Article", headline: insight.title,
        description: insight.excerpt, datePublished: insight.published_at, author: { "@type": "Person", name: insight.author },
        mainEntityOfPage: absoluteUrl(`/insights/${encodeURIComponent(insight.slug)}`), image: insight.cover_image ? absoluteUrl(insight.cover_image) : undefined,
      }) }} />
      <Nav />
      {preview && <aside className={styles.previewBanner}><strong>Preview mode</strong><span>This is the latest saved version and may not be published.</span><Link href={`/admin/insights/${insight.id}`}>Return to editor</Link></aside>}
      <main className={styles.main}>
        <ArticleHero category={insight.category} title={insight.title} excerpt={insight.excerpt} author={insight.author} publishedAt={insight.published_at} dateLabel={displayCompactDate(insight.published_at)} readingMinutes={readingMinutes} coverImage={insight.cover_image} mediaVariant="wide" />

        <div className={styles.divider} />

        <div className={`container ${styles.layout}`}>
          {(toc.length > 0 || relatedReadings.length > 0) && (
            <aside className={styles.toc}>
              <TableOfContents items={toc} relatedReadings={relatedReadings} />
              <RelatedReadingList items={relatedReadings} desktopOnly />
            </aside>
          )}

          <div className={styles.articleBody}>
            <RichContent html={bodyHtml} />
          </div>
        </div>

        {moreArticles.length > 0 && (
          <section className={`container ${styles.moreSection}`}>
            <p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>Keep reading</p>
            <h2 className="heading-01">More articles</h2>
            <div className={styles.moreGrid}>
              {moreArticles.map((article) => <ArticlePreview key={article.slug} slug={article.slug} category={article.category} title={article.title} excerpt={article.excerpt} minutes={calculateReadingTime(article.body)} />)}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
