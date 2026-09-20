import Link from "next/link";
import styles from "./ArticlePreview.module.css";

type ArticlePreviewProps = {
  slug: string;
  category?: string;
  title: string;
  excerpt: string;
  minutes: number;
  thumbnail?: string;
  featured?: boolean;
  headingLevel?: "h2" | "h3";
};

export function ArticlePreview({ slug, category = "Insights", title, excerpt, minutes, thumbnail, featured = false, headingLevel = "h3" }: ArticlePreviewProps) {
  const Heading = headingLevel;
  return (
    <Link href={`/insights/${slug}`} className={`${styles.preview} ${featured ? styles.featured : styles.standard}`}>
      {featured && <div className={styles.media} style={thumbnail ? { backgroundImage: `url(${thumbnail})` } : undefined} aria-hidden="true" />}
      <div className={styles.copy}>
        <p className={`label-eyebrow ${styles.category}`}>{category || "Insights"}</p>
        <Heading className={`${featured ? "heading-01" : "heading-03"} ${styles.title}`}>{title}</Heading>
        <p className={`body-small ${styles.excerpt}`}>{excerpt}</p>
        <span className={styles.action}>Read · {minutes} min <span aria-hidden="true">→</span></span>
      </div>
    </Link>
  );
}
