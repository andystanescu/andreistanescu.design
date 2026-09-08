import Link from "next/link";
import { ArrowIcon } from "@/components/Icon/ArrowIcon";
import { getCaseStudies } from "@/data/caseStudies";
import { AccentText } from "@/components/AccentText/AccentText";
import { getSection } from "@/lib/homepage";
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
        <div className={styles.intro}>
          <p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>
            {section.eyebrow}
          </p>
          <h2 className="display-small">
            <AccentText text={section.headline} />
          </h2>
          <p className="body-small" style={{ color: "var(--text-secondary)" }}>
            {section.description}
          </p>
        </div>

        <div className={styles.grid}>
          <Link
            href={`/work/${featured.slug}`}
            className={`${styles.featured} section-dark`}
          >
            <div>
              <p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>
                {featured.eyebrow}
              </p>
              <h3 className={`heading-02 ${styles.featuredTitle}`}>
                {featured.title}
              </h3>
              {featured.tags && (
                <p
                  className="body-small"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {featured.tags}
                </p>
              )}
              <p
                className={`body-small ${styles.featuredDescription}`}
                style={{ color: "var(--text-secondary)" }}
              >
                {featured.description}
              </p>
            </div>
            <span className={styles.link}>
              View case study
              <ArrowIcon size={16} />
            </span>
          </Link>

          {secondary.length > 0 && (
            <div className={styles.secondaryList}>
              {secondary.map((study) => (
                <Link
                  key={study.slug}
                  href={`/work/${study.slug}`}
                  className={styles.card}
                >
                  <div>
                    <p
                      className="label-eyebrow"
                      style={{ color: "var(--text-accent)" }}
                    >
                      {study.eyebrow}
                    </p>
                    <h3 className="heading-03">{study.title}</h3>
                  </div>
                  <span className={styles.link}>
                    View case study
                    <ArrowIcon size={16} />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
