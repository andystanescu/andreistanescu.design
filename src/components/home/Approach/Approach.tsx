import { getSection } from "@/lib/homepage";
import { getHomepageApproachSteps } from "@/lib/approachSteps";
import { HomepageSectionHeader } from "@/components/home/SectionHeader/HomepageSectionHeader";
import styles from "./Approach.module.css";

export function Approach() {
  const section = getSection("approach")!;
  const steps = getHomepageApproachSteps();

  if (steps.length === 0) {
    return null;
  }

  return (
    <section id="approach" className={styles.approach}>
      <div className={`container ${styles.approachInner}`}>
        <HomepageSectionHeader
          eyebrow={section.eyebrow}
          title={section.headline}
          intro={section.description}
        />
        <div className={styles.steps}>
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            return (
              <div key={step.id} className={styles.step}>
                {step.icon && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={step.icon}
                    alt=""
                    width={isLast ? 48 : 106}
                    height={48}
                  />
                )}
                <p className="mono-token" style={{ color: "var(--text-accent)" }}>
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="heading-03">{step.title}</h3>
                <p className="body-small" style={{ color: "var(--text-secondary)" }}>
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
