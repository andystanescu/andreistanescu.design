import { ServiceSection, ServiceSectionHeader } from "@/components/services/ServiceSection/ServiceSection";
import styles from "./GovernanceApproach.module.css";

const discovery = [
  ["01", "UNDERSTAND THE SYSTEM", "See the products, teams, constraints and existing guidance in context."],
  ["02", "FOLLOW REAL DECISIONS", "Trace how choices are made in practice before assigning formal ownership."],
  ["03", "FIND FRICTION + AMBIGUITY", "Notice repeated debate, unclear exceptions and places where work gets stuck."],
] as const;

const governance = [
  ["04", "CLARIFY OWNERSHIP + PRINCIPLES", "Shape responsibilities and useful guidance around the decisions people actually make."],
  ["05", "TEST THROUGH REAL CHANGE", "Try the model on a live contribution or change; a diagram alone is not validation."],
  ["06", "OBSERVE EXCEPTIONS", "Learn where the guidance fits, where it strains and what context the exception reveals."],
  ["07", "ADJUST THE MODEL", "Use outcomes and repeated exceptions to refine the rules and choose what needs attention next."],
] as const;

function StageList({ items, label }: { items: readonly (readonly [string, string, string])[]; label: string }) {
  return (
    <ol className={styles.stages} aria-label={label}>
      {items.map(([number, title, description]) => (
        <li key={number}>
          <span>{number}</span>
          <div>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function GovernanceApproach() {
  return (
    <ServiceSection width="wide" labelledBy="governance-approach-title" className={styles.section}>
      <ServiceSectionHeader
        eyebrow="APPROACH"
        title="Understand how decisions happen before designing how they should."
        description="Start broad, follow real work, then focus on the moments where ownership or guidance would make a difference. Test the model in practice and let evidence shape what comes next."
        titleId="governance-approach-title"
        className={styles.header}
      />

      <div className={styles.phases}>
        <section className={styles.phase} aria-labelledby="governance-discovery-title">
          <h3 id="governance-discovery-title">UNDERSTAND BEFORE DEFINING</h3>
          <StageList items={discovery} label="Understand the system and how decisions happen" />
        </section>
        <section className={styles.phase} aria-labelledby="governance-change-title-approach">
          <h3 id="governance-change-title-approach">SHAPE, TEST AND ADAPT</h3>
          <StageList items={governance} label="Shape and validate governance through real work" />
        </section>
      </div>

      <p className={styles.feedback}><span aria-hidden="true">↺</span> Observed outcomes and exceptions return to the model, informing the next decision and priority.</p>
    </ServiceSection>
  );
}
