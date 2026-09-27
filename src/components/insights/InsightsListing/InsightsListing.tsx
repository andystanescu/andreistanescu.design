"use client";

import { useMemo, useRef, useState, type PointerEvent } from "react";
import type { Insight } from "@/data/insights";
import { calculateReadingTime } from "@/lib/readingTime";
import { ArticlePreview } from "@/components/insights/ArticlePreview/ArticlePreview";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import styles from "./InsightsListing.module.css";

function getTags(value: string) {
  return value.split(/[,;\n|*·]+/).map((tag) => tag.trim()).filter(Boolean);
}

function getFilterValues(insight: Insight) {
  return Array.from(new Set([insight.category.trim(), ...getTags(insight.tags)].filter(Boolean)));
}

export function InsightsListing({ insights }: { insights: Insight[] }) {
  const [selectedTag, setSelectedTag] = useState("All");
  const [visibleCount, setVisibleCount] = useState(9);
  const dragState = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });
  const tags = useMemo(
    () => Array.from(new Set(insights.flatMap(getFilterValues))),
    [insights]
  );
  const filteredInsights = insights.filter(
    (insight) => selectedTag === "All" || getFilterValues(insight).includes(selectedTag)
  );
  const featured = filteredInsights[0];
  const additional = filteredInsights.slice(1);
  const visibleArticles = additional.slice(0, visibleCount);

  const selectTag = (tag: string) => {
    setSelectedTag(tag);
    setVisibleCount(9);
  };

  const startFilterDrag = (event: PointerEvent<HTMLDivElement>) => {
    dragState.current = { active: false, startX: 0, scrollLeft: 0, moved: false };
    if (event.pointerType === "touch" || event.button !== 0) return;
    if (event.currentTarget.scrollWidth <= event.currentTarget.clientWidth) return;
    dragState.current = { active: true, startX: event.clientX, scrollLeft: event.currentTarget.scrollLeft, moved: false };
  };

  const moveFilterDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragState.current.active) return;
    const distance = event.clientX - dragState.current.startX;
    if (Math.abs(distance) <= 4) return;
    dragState.current.moved = true;
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.scrollLeft = dragState.current.scrollLeft - distance;
  };

  const endFilterDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragState.current.active) return;
    dragState.current.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  if (insights.length === 0) return null;

  return (
    <>
      <section className={styles.featuredSection}>
        <div className={styles.filters} role="list" aria-label="Filter articles by tag" onPointerDown={startFilterDrag} onPointerMove={moveFilterDrag} onPointerUp={endFilterDrag} onPointerCancel={endFilterDrag}>
          <button type="button" aria-pressed={selectedTag === "All"} className={selectedTag === "All" ? styles.filterActive : styles.filter} onClick={() => selectTag("All")}>All</button>
          {tags.map((tag) => (
            <button key={tag} type="button" aria-pressed={selectedTag === tag} className={selectedTag === tag ? styles.filterActive : styles.filter} onClick={() => selectTag(tag)}>{tag}</button>
          ))}
        </div>

        {featured && <ArticlePreview slug={featured.slug} category={featured.category} title={featured.title} excerpt={featured.excerpt} minutes={calculateReadingTime(featured.body)} thumbnail={featured.thumbnail_image} featured headingLevel="h2" />}
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
      {selectedTag !== "All" && filteredInsights.length === 0 && <section className={styles.gridSection}>
        <EmptyState eyebrow="No matches" title={`No articles in ${selectedTag}`} description="Try another category or show every published article." action={<button type="button" onClick={() => selectTag("All")}>Show all articles</button>} />
      </section>}
    </>
  );
}
