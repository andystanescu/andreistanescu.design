import Link from "next/link";
import { ArrowIcon } from "@/components/Icon/ArrowIcon";
import styles from "./ProjectCard.module.css";

type ProjectCardProps = {
  slug: string;
  title: string;
  description: string;
  thumbnail?: string;
  category?: string;
  index: number;
  year?: string;
  inProgress?: boolean;
  protectedStudy?: boolean;
  featured?: boolean;
  mediaTreatment?: "standard" | "feature";
  headingLevel?: "h2" | "h3";
};

export function ProjectCard({ slug, title, description, thumbnail, category = "Case study", index, year, inProgress = false, protectedStudy = false, featured = false, mediaTreatment = featured ? "feature" : "standard", headingLevel = "h3" }: ProjectCardProps) {
  const Heading = headingLevel;
  const statuses = [inProgress ? "In progress" : "", protectedStudy ? "Protected" : ""].filter(Boolean);
  return (
    <Link className={`${styles.card} ${featured ? styles.featured : ""}`} href={`/work/${encodeURIComponent(slug)}`}>
      <p className={`label-eyebrow ${styles.kicker}`}>{category || "Case study"} / {String(index).padStart(2, "0")}</p>
      <Heading className={`${featured ? "heading-01" : "heading-03"} ${styles.title}`}>{title}</Heading>
      <p className={`body-small ${styles.description}`}>{description}</p>
      <div className={`${styles.media} ${mediaTreatment === "feature" ? styles.featureMedia : styles.standardMedia}`} style={thumbnail ? { backgroundImage: `url(${thumbnail})` } : undefined} aria-hidden="true" />
      {(year || statuses.length > 0) && <div className={styles.metadata}>{year && <span>{year}</span>}{statuses.map((status) => <span key={status}>{status}</span>)}</div>}
      <span className={styles.action}>View case study <ArrowIcon size={16} /></span>
    </Link>
  );
}
