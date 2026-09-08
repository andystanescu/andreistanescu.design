import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav/Nav";
import { Footer } from "@/components/Footer/Footer";
import { RichContent } from "@/components/RichContent/RichContent";
import { ArticleCard } from "@/components/ArticleCard/ArticleCard";
import { getInsightBySlug, getRandomInsights } from "@/data/insights";
import { addHeadingIds } from "@/lib/tableOfContents";
import { TableOfContents } from "@/components/TableOfContents/TableOfContents";
import { calculateReadingTime } from "@/lib/readingTime";
import { ShareArticle } from "@/components/ShareArticle/ShareArticle";
import { BackButton } from "@/components/BackButton/BackButton";
import styles from "./insight.module.css";
import { contentMetadata, absoluteUrl } from "@/lib/seo";
import { displayDate } from "@/lib/dateUtils";
import { AuthorAvatar } from "@/components/AuthorAvatar/AuthorAvatar";
import { recordAnalyticsEvent, visitorContextFromHeaders } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const insight = getInsightBySlug(slug);
  if (!insight) return {};
  return contentMetadata({ title: insight.meta_title || `${insight.title} | Andrei Stanescu`, description: insight.meta_description || insight.excerpt, path: `/insights/${encodeURIComponent(insight.slug)}`, image: insight.og_image || insight.thumbnail_image || insight.cover_image, keywords: insight.meta_keywords, canonicalUrl: insight.canonical_url || undefined, noIndex: Boolean(insight.no_index) });
}

export default async function InsightDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const insight = getInsightBySlug(slug);

  if (!insight) {
    notFound();
  }
  recordAnalyticsEvent("view", "article", insight.slug, visitorContextFromHeaders(await headers()));

  const { html: bodyHtml, toc } = addHeadingIds(insight.body);
  const readingMinutes = calculateReadingTime(insight.body);
  const moreArticles = getRandomInsights(insight.slug, 3);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "Article", headline: insight.title,
        description: insight.excerpt, datePublished: insight.published_at, author: { "@type": "Person", name: insight.author },
        mainEntityOfPage: absoluteUrl(`/insights/${encodeURIComponent(insight.slug)}`), image: insight.cover_image ? absoluteUrl(insight.cover_image) : undefined,
      }) }} />
      <Nav />
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <BackButton label="Back to insights" fallbackHref="/insights" />
            <p className={`body-small ${styles.breadcrumb}`}>
              <Link href="/insights">Insights</Link>
              {insight.category && <> &nbsp;/&nbsp; {insight.category}</>}
            </p>

            {insight.category && (
              <p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>
                {insight.category}
              </p>
            )}

            <h1 className={`display-small ${styles.title}`}>{insight.title}</h1>

            <p className="body-large" style={{ color: "var(--text-secondary)" }}>
              {insight.excerpt}
            </p>

            <div className={styles.byline}>
              <p className="body-small" style={{ color: "var(--text-secondary)" }}>
                <AuthorAvatar author={insight.author} />
              </p>
              <p className="body-small" style={{ color: "var(--text-tertiary)" }}>
                {displayDate(insight.published_at)} &nbsp;•&nbsp; {readingMinutes} min read
              </p>
              {insight.tags && (
                <p className={styles.tags}>{insight.tags}</p>
              )}
            </div>

            <ShareArticle title={insight.title} />
          </div>

          {insight.cover_image && (
            <div className={styles.heroImage}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={insight.cover_image} alt="" />
            </div>
          )}
        </section>

        <div className={styles.divider} />

        <div className={`container ${styles.layout}`}>
          {toc.length > 0 && (
            <aside className={styles.toc}>
              <TableOfContents items={toc} />
              <p className="label-small" style={{ color: "var(--text-primary)" }}>
                ON THIS PAGE
              </p>
              <nav aria-label="On this page">
                <ul>
                  {toc.map((item) => (
                    <li key={item.id}>
                      <a href={`#${item.id}`}>{item.text}</a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          )}

          <div className={styles.articleBody}>
            <RichContent html={bodyHtml} />
          </div>
        </div>

        {moreArticles.length > 0 && (
          <section className={`container ${styles.moreSection}`}>
            <p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>
              Keep reading
            </p>
            <h2 className="heading-01">More articles</h2>
            <div className={styles.moreGrid}>
              {moreArticles.map((article) => (
                <ArticleCard
                  key={article.slug}
                  slug={article.slug}
                  title={article.title}
                  excerpt={article.excerpt}
                  thumbnail={article.thumbnail_image}
                />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
