import Link from "next/link";
import { getInsightBySlug } from "@/data/insights";
import { getCaseStudyBySlug } from "@/data/caseStudies";
import { calculateReadingTime } from "@/lib/readingTime";
import { ArrowIcon } from "@/components/Icon/ArrowIcon";
import styles from "./RelatedInsightCard.module.css";

export function RelatedInsightCard({ slug, contentType = "article" }: { slug: string; contentType?: "article" | "case_study" }) {
  const content = contentType === "case_study" ? getCaseStudyBySlug(slug) : getInsightBySlug(slug);
  if (!content) return null;
  const readingMinutes = calculateReadingTime(content.body);
  const label = contentType === "case_study" ? "Case study" : "Article";
  const href = contentType === "case_study" ? `/work/${encodeURIComponent(content.slug)}` : `/insights/${encodeURIComponent(content.slug)}`;
  return <Link href={href} className={styles.card}>
    <div className={styles.thumbnail} style={content.thumbnail_image ? { backgroundImage: `url(${content.thumbnail_image})` } : undefined} aria-hidden="true" />
    <div className={styles.copy}><span className={styles.eyebrow}>Related reading</span><h3>{content.title}</h3><div className={styles.meta}><span>{label} · {readingMinutes} min read</span><strong>{contentType === "case_study" ? "View case study" : "Read article"} <ArrowIcon size={14} /></strong></div></div>
  </Link>;
}
