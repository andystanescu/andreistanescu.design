import { getCaseStudies } from "@/data/caseStudies";
import { getSection } from "@/lib/homepage";
import { HomepageSectionHeader } from "@/components/home/SectionHeader/HomepageSectionHeader";
import { ProjectCard } from "@/components/work/ProjectCard/ProjectCard";
import styles from "./SelectedImpact.module.css";

export function SelectedImpact() {
  const caseStudies = getCaseStudies();
  const section = getSection("selected_impact")!;
  if (caseStudies.length === 0) {
    return null;
  }

  const [featured, ...rest] = caseStudies;
  const secondary = rest.slice(0, 2);

  return (
    <section id="selected_impact" className={styles.impact}>
      <div className={`container ${styles.impactInner}`}>
        <HomepageSectionHeader
          eyebrow={section.eyebrow}
          title={section.headline}
          intro={section.description}
        />

        <div className={styles.grid}>
          <ProjectCard slug={featured.slug} title={featured.title} description={featured.description} thumbnail={featured.thumbnail_image} category={featured.category || featured.eyebrow} index={1} year={featured.year} inProgress={Boolean(featured.in_progress)} protectedStudy={Boolean(featured.password_required)} featured />

          {secondary.length > 0 && (
            <div className={styles.secondaryList}>
              {secondary.map((study, index) => (
                <ProjectCard key={study.slug} slug={study.slug} title={study.title} description={study.description} thumbnail={study.thumbnail_image} category={study.category || study.eyebrow} index={index + 2} year={study.year} inProgress={Boolean(study.in_progress)} protectedStudy={Boolean(study.password_required)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
