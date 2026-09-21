import { getExperiences, getVisibleSection, getSection } from "@/lib/about";
import { getSettings } from "@/lib/settings";
import styles from "./AboutBeforeConScept.module.css";
import { displayMonthYear } from "@/lib/dateUtils";
import { RichContent } from "@/components/RichContent/RichContent";
import { AboutSectionShell } from "@/components/about/AboutSectionShell/AboutSectionShell";

export function AboutBeforeConScept({ preview = false }: { preview?: boolean } = {}) {
  if (getSettings().logo_identity !== "personal") return null;
  const section = preview ? getSection("before_conscept") : getVisibleSection("before_conscept");
  if (!section) return null;
  const experiences = getExperiences();

  return (
    <AboutSectionShell id="before-conscept" eyebrow={section.eyebrow} heading={section.headline} intro={section.description} headingClassName="heading-01" introClassName="body-large" headerWidth="wide" contentWidth="full">
      <div className={styles.timeline}>
        {experiences.map((experience) => (
          <article key={experience.id} className={styles.entry}>
            <div className={styles.rail}>
              <p className={styles.dates}>
                {displayMonthYear(experience.start_date)} — {experience.end_date ? displayMonthYear(experience.end_date) : "Present"}
              </p>
            </div>
            <div className={styles.entryContent}>
              <header className={styles.role}>
                <h3>{experience.job_title}</h3>
                <p className={styles.company}>{experience.company_name}{experience.business_profile ? ` · ${experience.business_profile}` : ""}</p>
              </header>
              <div className={styles.description}><RichContent html={experience.description} /></div>
            </div>
          </article>
        ))}
      </div>
    </AboutSectionShell>
  );
}
