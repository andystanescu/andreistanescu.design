"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./dashboard-home.module.css";

export type MostReadItem = {
  slug: string;
  contentType: "case_study" | "article";
  views: number;
  title: string;
};

export function MostReadPanel({ items }: { items: MostReadItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = items.length > 3;
  const visibleItems = expanded ? items : items.slice(0, 3);

  return (
    <section className={styles.panel} aria-labelledby="most-read">
      <div className={styles.panelHeader}>
        <h2 id="most-read" className="heading-03">Most read, last 30 days</h2>
        <span className={styles.panelNote}>What&apos;s actually resonating</span>
      </div>
      {items.length ? (
        <>
          <div className={styles.readList}>
            {visibleItems.map((item, index) => (
              <Link
                key={`${item.contentType}-${item.slug}`}
                href={item.contentType === "article" ? `/insights/${item.slug}` : `/work/${item.slug}`}
                className={styles.readRow}
              >
                <span className={styles.rank}>{index + 1}</span>
                <span className={styles.readTitle}>{item.title || item.slug}</span>
                <span className={styles.type}>{item.contentType === "article" ? "Article" : "Case study"}</span>
                <span className={styles.views}>{item.views} {item.views === 1 ? "view" : "views"}</span>
              </Link>
            ))}
          </div>
          {hasMore && (
            <div className={styles.readListFooter}>
              <span>{expanded ? `Showing all ${items.length}` : `+${items.length - 3} more with unique views`}</span>
              <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
                {expanded ? "Show top 3" : "View all"}
                <span aria-hidden="true">{expanded ? "−" : "+"}</span>
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="body-small" style={{ color: "var(--text-tertiary)" }}>No content views have been recorded yet.</p>
      )}
    </section>
  );
}
