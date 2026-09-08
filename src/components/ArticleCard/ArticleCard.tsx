import Link from "next/link";
import { ArrowIcon } from "@/components/Icon/ArrowIcon";
import styles from "./ArticleCard.module.css";

type ArticleCardProps = {
  slug: string;
  title: string;
  excerpt: string;
  thumbnail?: string;
  className?: string;
  variant?: "default" | "caseStudy";
  category?: string;
  meta?: string;
  showThumbnail?: boolean;
};

// Resting/hover states per Figma (node 157:203) — thumbnail, title,
// excerpt, "Read article" link. Used for an insight article's "More
// articles" grid; kept separate from the homepage's larger featured-card
// layout (LatestInsights), which has its own hover treatment.
export function ArticleCard({ slug, title, excerpt, thumbnail, className, variant = "default", category = "", meta = "", showThumbnail = true }: ArticleCardProps) {
  const isCaseStudy = variant === "caseStudy";
  return (
    <Link href={`${isCaseStudy ? "/work" : "/insights"}/${slug}`} className={`${styles.card} ${isCaseStudy ? styles.caseStudy : ""}${className ? ` ${className}` : ""}`}>
      {showThumbnail && <div
        className={styles.thumb}
        style={thumbnail ? { backgroundImage: `url(${thumbnail})` } : undefined}
        aria-hidden="true"
      />}
      <div className={styles.body}>
        {(category || meta) && <div className={styles.meta}><span>{category}</span>{meta && <span className={styles.metaSecondary}>{meta}</span>}</div>}
        <h3 className={`heading-03 ${styles.title}`}>{title}</h3>
        <p className="body-small" style={{ color: "var(--text-secondary)" }}>
          {excerpt}
        </p>
        <span className={styles.link}>
          {isCaseStudy ? "View case study" : "Read article"}
          <ArrowIcon size={14} />
        </span>
      </div>
    </Link>
  );
}
