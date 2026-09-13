import Link from "next/link";
import { getInsightBySlug } from "@/data/insights";
import { calculateReadingTime } from "@/lib/readingTime";
import { ArrowIcon } from "@/components/Icon/ArrowIcon";
import styles from "./RelatedInsightCard.module.css";

export function RelatedInsightCard({ slug }: { slug: string }) {
  const insight = getInsightBySlug(slug);
  if (!insight) return null;
  const readingMinutes = calculateReadingTime(insight.body);
  return <Link href={`/insights/${encodeURIComponent(insight.slug)}`} className={styles.card}>
    <div className={styles.thumbnail} style={insight.thumbnail_image ? { backgroundImage: `url(${insight.thumbnail_image})` } : undefined} aria-hidden="true" />
    <div className={styles.copy}><span className={styles.eyebrow}>Related reading</span><h3>{insight.title}</h3><div className={styles.meta}><span>Article · {readingMinutes} min read</span><strong>Read article <ArrowIcon size={14} /></strong></div></div>
  </Link>;
}
