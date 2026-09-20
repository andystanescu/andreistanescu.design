"use client";

import { useMemo, useState } from "react";
import type { Insight } from "@/data/insights";
import { calculateReadingTime } from "@/lib/readingTime";
import { ArticlePreview } from "@/components/insights/ArticlePreview/ArticlePreview";
import styles from "./InsightsListing.module.css";

function getTags(value: string) {
  return value.split(/[,;\n|*·]+/).map((tag) => tag.trim()).filter(Boolean);
}

export function InsightsListing({ insights }: { insights: Insight[] }) {
  const [selectedTag, setSelectedTag] = useState("All");
  const [visibleCount, setVisibleCount] = useState(9);
  const featured = insights[0];
  const tags = useMemo(
    () => Array.from(new Set(insights.flatMap((insight) => getTags(insight.tags)))),
    [insights]
  );
  const additional = insights
    .slice(1)
    .filter((insight) => selectedTag === "All" || getTags(insight.tags).includes(selectedTag));
  const visibleArticles = additional.slice(0, visibleCount);

  if (!featured) return null;

  return (
    <>
      <section className={styles.featuredSection}>
        <div className={styles.filters} role="list" aria-label="Filter articles by tag">
          <button type="button" className={selectedTag === "All" ? styles.filterActive : styles.filter} onClick={() => { setSelectedTag("All"); setVisibleCount(9); }}>All</button>
          {tags.map((tag) => (
            <button key={tag} type="button" className={selectedTag === tag ? styles.filterActive : styles.filter} onClick={() => { setSelectedTag(tag); setVisibleCount(9); }}>{tag}</button>
          ))}
        </div>

        <ArticlePreview slug={featured.slug} category={featured.category} title={featured.title} excerpt={featured.excerpt} minutes={calculateReadingTime(featured.body)} thumbnail={featured.thumbnail_image} featured headingLevel="h2" />
      </section>

      {additional.length > 0 && (
        <section className={styles.gridSection}>
          <div className={styles.grid}>
            {visibleArticles.map((article) => (
              <ArticlePreview key={`${selectedTag}-${article.slug}`} slug={article.slug} category={article.category || getTags(article.tags)[0]} title={article.title} excerpt={article.excerpt} minutes={calculateReadingTime(article.body)} />
            ))}
          </div>
          {insights.length >= 8 && visibleCount < additional.length && (
            <button type="button" className={styles.loadMore} onClick={() => setVisibleCount((count) => count + 9)}>
              Load more articles <span aria-hidden="true">↓</span>
            </button>
          )}
        </section>
      )}
    </>
  );
}
