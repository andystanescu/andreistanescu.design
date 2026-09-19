import Link from "next/link";
import { getCaseStudyBySlug } from "@/data/caseStudies";
import { getInsightBySlug } from "@/data/insights";
import type { RelatedReadingReference } from "@/lib/interactiveBlocks";
import { calculateReadingTime } from "@/lib/readingTime";
import styles from "./RelatedReadingList.module.css";

export function RelatedReadingList({ items }: { items: RelatedReadingReference[] }) {
  const readings = items.flatMap((item) => {
    const content = item.contentType === "case_study" ? getCaseStudyBySlug(item.slug) : getInsightBySlug(item.slug);
    if (!content) return [];
    return [{
      ...item,
      title: content.title,
      minutes: calculateReadingTime(content.body),
      href: item.contentType === "case_study" ? `/work/${encodeURIComponent(content.slug)}` : `/insights/${encodeURIComponent(content.slug)}`,
    }];
  });

  if (!readings.length) return null;

  return <section className={styles.section} aria-labelledby="related-reading-title">
    <h2 id="related-reading-title">Related reading</h2>
    <ol>
      {readings.map((item, index) => <li key={`${item.contentType}-${item.slug}-${index}`}>
        <Link href={item.href}>
          <span className={styles.index}>{String(index + 1).padStart(2, "0")}</span>
          <span className={styles.copy}><strong>{item.title}</strong><small>{item.contentType === "case_study" ? "Case study" : "Article"} · {item.minutes} min read</small></span>
        </Link>
      </li>)}
    </ol>
  </section>;
}
