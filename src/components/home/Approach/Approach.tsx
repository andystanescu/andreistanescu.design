import { getSection } from "@/lib/homepage";
import { getHomepageApproachSteps } from "@/lib/approachSteps";
import { HomepageSectionHeader } from "@/components/home/SectionHeader/HomepageSectionHeader";
import { ProcessStepper } from "@/components/ProcessStepper/ProcessStepper";
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
        <ProcessStepper steps={steps} label={section.headline} />
      </div>
    </section>
  );
}
