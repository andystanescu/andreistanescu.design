"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowIcon } from "@/components/Icon/ArrowIcon";
import type { Insight } from "@/data/insights";
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

        <Link href={`/insights/${featured.slug}`} className={styles.featured}>
          <div className={styles.featuredVisual} style={featured.thumbnail_image ? { backgroundImage: `url(${featured.thumbnail_image})` } : undefined}>
            {!featured.thumbnail_image && <img src="/assets/lattice-diagram.svg" alt="" className={styles.lattice} />}
            <span className={styles.featuredMeta}><i aria-hidden="true" />{featured.category || "INSIGHTS"}{featured.published_at ? ` · ${new Date(featured.published_at).getFullYear()}` : ""}</span>
          </div>
          <div className={styles.featuredCopy}>
            <p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>{featured.category || "INSIGHTS"}</p>
            <h2 className="heading-01">{featured.title}</h2>
            <p className="body-default" style={{ color: "var(--text-secondary)" }}>{featured.excerpt}</p>
            <span className={styles.readLink}>Read article <ArrowIcon size={16} /></span>
          </div>
        </Link>
      </section>

      {additional.length > 0 && (
        <section className={styles.gridSection}>
          <div className={styles.grid}>
            {visibleArticles.map((article) => (
              <Link key={`${selectedTag}-${article.slug}`} href={`/insights/${article.slug}`} className={styles.card}>
                <div className={styles.thumb} style={article.thumbnail_image ? { backgroundImage: `url(${article.thumbnail_image})` } : undefined} />
                <div className={styles.cardBody}>
                  <p className={styles.cardTags}>{getTags(article.tags).join(" · ")}</p>
                  <h3 className="heading-03">{article.title}</h3>
                  <p className="body-small" style={{ color: "var(--text-secondary)" }}>{article.excerpt}</p>
                  <span className={styles.readLink}>Read article <ArrowIcon size={14} /></span>
                </div>
              </Link>
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
