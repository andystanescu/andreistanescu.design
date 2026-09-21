"use client";

import { useMemo, useRef, useState, type PointerEvent } from "react";
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
  const filterRowRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });
  const featured = insights[0];
  const tags = useMemo(
    () => Array.from(new Set(insights.flatMap((insight) => getTags(insight.tags)))),
    [insights]
  );
  const additional = insights
    .slice(1)
    .filter((insight) => selectedTag === "All" || getTags(insight.tags).includes(selectedTag));
  const visibleArticles = additional.slice(0, visibleCount);

  const selectTag = (tag: string) => {
    if (dragState.current.moved) {
      dragState.current.moved = false;
      return;
    }
    setSelectedTag(tag);
    setVisibleCount(9);
  };

  const startFilterDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" || event.button !== 0) return;
    dragState.current = { active: true, startX: event.clientX, scrollLeft: event.currentTarget.scrollLeft, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveFilterDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragState.current.active) return;
    const distance = event.clientX - dragState.current.startX;
    if (Math.abs(distance) > 4) dragState.current.moved = true;
    event.currentTarget.scrollLeft = dragState.current.scrollLeft - distance;
  };

  const endFilterDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragState.current.active) return;
    dragState.current.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  if (!featured) return null;

  return (
    <>
      <section className={styles.featuredSection}>
        <div ref={filterRowRef} className={styles.filters} role="list" aria-label="Filter articles by tag" onPointerDown={startFilterDrag} onPointerMove={moveFilterDrag} onPointerUp={endFilterDrag} onPointerCancel={endFilterDrag}>
          <button type="button" className={selectedTag === "All" ? styles.filterActive : styles.filter} onClick={() => selectTag("All")}>All</button>
          {tags.map((tag) => (
            <button key={tag} type="button" className={selectedTag === tag ? styles.filterActive : styles.filter} onClick={() => selectTag(tag)}>{tag}</button>
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
