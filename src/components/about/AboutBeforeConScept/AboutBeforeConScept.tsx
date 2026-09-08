import { getExperiences, getVisibleSection, getSection } from "@/lib/about";
import { getSettings } from "@/lib/settings";
import styles from "./AboutBeforeConScept.module.css";
import { displayMonthYear } from "@/lib/dateUtils";
import { RichContent } from "@/components/RichContent/RichContent";

export function AboutBeforeConScept({ preview = false }: { preview?: boolean } = {}) {
  if (getSettings().logo_identity !== "personal") return null;
  const section = preview ? getSection("before_conscept") : getVisibleSection("before_conscept");
  if (!section) return null;
  const experiences = getExperiences();

  return (
    <section id="before-conscept" className={`container ${styles.section}`}>
      <p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>{section.eyebrow}</p>
      <h2 className="heading-01">{section.headline}</h2>
      {section.description && <p className={`body-large ${styles.intro}`}>{section.description}</p>}
      <div className={styles.timeline}>
        {experiences.map((experience) => (
          <article key={experience.id} className={styles.card}>
            <p className={styles.dates}>
              {displayMonthYear(experience.start_date)} — {experience.end_date ? displayMonthYear(experience.end_date) : "Present"}
            </p>
            <div className={styles.body}>
              <h3>{experience.job_title}</h3>
              <p className={styles.company}>{experience.company_name}{experience.business_profile ? ` · ${experience.business_profile}` : ""}</p>
            </div>
            <div className={styles.description}><RichContent html={experience.description} /></div>
          </article>
        ))}
      </div>
    </section>
  );
}
