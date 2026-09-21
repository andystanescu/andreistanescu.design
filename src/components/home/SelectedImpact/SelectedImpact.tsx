import { getCaseStudies, getCaseStudyMetrics } from "@/data/caseStudies";
import { getSection } from "@/lib/homepage";
import { HomepageSectionHeader } from "@/components/home/SectionHeader/HomepageSectionHeader";
import { ProjectCollection } from "@/components/work/ProjectCollection/ProjectCollection";
import { ImpactMetrics } from "@/components/ImpactMetrics/ImpactMetrics";
import styles from "./SelectedImpact.module.css";

export function SelectedImpact() {
  const caseStudies = getCaseStudies();
  const section = getSection("selected_impact")!;
  if (caseStudies.length === 0) {
    return null;
  }

  const [featured] = caseStudies;
  const featuredMetrics = getCaseStudyMetrics(featured);

  return (
    <section id="selected_impact" className={styles.impact}>
      <div className={`container ${styles.impactInner}`}>
        <HomepageSectionHeader
          eyebrow={section.eyebrow}
          title={section.headline}
          intro={section.description}
          className={styles.sectionHeader}
        />

        <div className={styles.grid}>
          <ProjectCollection studies={caseStudies} limit={4} responsivePreview />
          {featuredMetrics.length > 0 && (
            <div className={styles.impactSummary}>
              <p className="label-eyebrow">Featured impact</p>
              <ImpactMetrics metrics={featuredMetrics} label={`${featured.title} impact metrics`} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
