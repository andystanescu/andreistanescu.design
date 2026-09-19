"use client";

import Link from "next/link";
import type { ResolvedRelatedReading } from "@/lib/relatedReadings";
import styles from "./RelatedReadingList.module.css";

export function RelatedReadingList({ items, desktopOnly = false }: { items: ResolvedRelatedReading[]; desktopOnly?: boolean }) {
  if (!items.length) return null;

  return <section className={`${styles.section} ${desktopOnly ? styles.desktopOnly : ""}`} aria-label="Related reading">
    <h2>Related reading</h2>
    <ol>
      {items.map((item, index) => <li key={`${item.contentType}-${item.slug}-${index}`}>
        <Link href={item.href}>
          <span className={styles.index}>{String(index + 1).padStart(2, "0")}</span>
          <span className={styles.copy}><strong>{item.title}</strong><small>{item.contentType === "case_study" ? "Case study" : "Article"} · {item.minutes} min read</small></span>
        </Link>
      </li>)}
    </ol>
  </section>;
}
