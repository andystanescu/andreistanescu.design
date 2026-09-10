import Link from "next/link";
import { ArrowIcon } from "@/components/Icon/ArrowIcon";
import styles from "@/app/work/work.module.css";

export function FeaturedCaseStudyCard({ slug, title, description, thumbnail, category = "CASE STUDY", year = "" }: { slug: string; title: string; description: string; thumbnail: string; category?: string; year?: string }) {
  return <Link className={styles.featured} href={`/work/${encodeURIComponent(slug)}`}><div className={styles.featuredVisual} style={thumbnail ? { backgroundImage: `url(${thumbnail})` } : undefined} aria-hidden="true"><span className={styles.featuredMeta}><i aria-hidden="true" />{category}{year ? ` · ${year}` : ""}</span></div><div className={styles.featuredCopy}><p className="label-eyebrow" style={{ color: "var(--text-on-deep-accent)" }}>FEATURED CASE STUDY</p><h2 className="heading-01">{title}</h2><p className="body-default" style={{ color: "var(--text-on-deep-secondary)" }}>{description}</p><span className={styles.featuredLink}>Read case study <ArrowIcon size={16} /></span></div></Link>;
}
