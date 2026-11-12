import type { CaseStudy } from "@/data/caseStudies";
import { ProjectCard } from "@/components/work/ProjectCard/ProjectCard";
import styles from "./ProjectCollection.module.css";

export type ProjectSummary = Pick<CaseStudy, "slug" | "title" | "description" | "thumbnail_image" | "category" | "eyebrow" | "year" | "in_progress" | "password_required">;

export function ProjectCollection({ studies, limit, responsivePreview = false, resultClassName = "" }: { studies: ProjectSummary[]; limit?: number; responsivePreview?: boolean; resultClassName?: string }) {
  const visibleStudies = typeof limit === "number" ? studies.slice(0, limit) : studies;
  const [featured, ...remaining] = visibleStudies;

  if (!featured) return null;

  return <div className={`${styles.collection} ${responsivePreview ? styles.responsivePreview : ""}`}>
    <ProjectCard key={featured.slug} className={resultClassName} slug={featured.slug} title={featured.title} description={featured.description} thumbnail={featured.thumbnail_image} category={featured.category || featured.eyebrow} index={1} year={featured.year} inProgress={Boolean(featured.in_progress)} protectedStudy={Boolean(featured.password_required)} featured headingLevel="h2" />
    {remaining.length > 0 && <div className={`${styles.grid} ${remaining.length === 2 ? styles.twoUp : ""}`}>
      {remaining.map((study, index) => <ProjectCard key={study.slug} className={resultClassName} slug={study.slug} title={study.title} description={study.description} thumbnail={study.thumbnail_image} category={study.category || study.eyebrow} index={index + 2} year={study.year} inProgress={Boolean(study.in_progress)} protectedStudy={Boolean(study.password_required)} />)}
    </div>}
  </div>;
}
