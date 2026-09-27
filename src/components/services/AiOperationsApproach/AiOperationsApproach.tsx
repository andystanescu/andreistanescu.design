import { ServiceSection, ServiceSectionHeader } from "@/components/services/ServiceSection/ServiceSection";
import styles from "./AiOperationsApproach.module.css";

const discovery = [
  ["01", "OVERALL DISCOVERY", "Understand the work", "Map the tasks, people, context and constraints across the workflow."],
  ["02", "OPPORTUNITY LANDSCAPE", "Find friction and opportunity", "Notice repeated effort, delays, exceptions and places where support could help."],
  ["03", "PRIORITISE", "Choose where to focus", "Select an opportunity by value and consequence, not by how much can be automated."],
  ["04", "DEEP DISCOVERY", "Understand consequence", "Examine confidence, reversibility, failure cost and the evidence available."],
] as const;

const responsibilities = [
  ["HUMAN-LED", "Person decides", "AI assists with preparation, retrieval or suggestions."],
  ["SHARED", "AI proposes; person decides", "A person reviews the proposal and owns the decision."],
  ["AI-LED WITHIN BOUNDS", "AI acts within agreed rules", "Uncertainty, exceptions or conflicting evidence return the work to a person."],
] as const;

const learning = [
  ["06", "EXECUTE · TEST IN REAL WORK", "Put the chosen responsibility boundary into the actual workflow and test it in context."],
  ["07", "LEARN · OBSERVE", "Review quality, outcomes, exceptions and effects on the people doing the work."],
  ["08", "REPRIORITISE", "Use evidence and governed review to adjust the boundary or choose the next opportunity."],
] as const;

export function AiOperationsApproach() {
  return (
    <ServiceSection width="wide" labelledBy="ai-approach-title" className={styles.section}>
      <ServiceSectionHeader
        eyebrow="APPROACH"
        title="Find the right boundary for every piece of work."
        description="Understand the work broadly, then investigate the most useful opportunity closely. The right responsibility depends on confidence, consequence and context."
        titleId="ai-approach-title"
        className={styles.header}
      />

      <ol className={styles.discovery} aria-label="From broad discovery to a focused decision">
        {discovery.map(([number, label, title, description]) => (
          <li key={number}>
            <span className={styles.stepMeta}>{number} <span aria-hidden="true">/</span> {label}</span>
            <h3>{title}</h3>
            <p>{description}</p>
          </li>
        ))}
      </ol>

      <section className={styles.decision} aria-labelledby="ai-approach-decision-title">
        <div className={styles.decisionIntro}>
          <span className={styles.stepMeta}>05 / DECIDE</span>
          <h3 id="ai-approach-decision-title">Define responsibility for this work.</h3>
          <p>These are parallel choices, not stages in a maturity journey. Different tasks can sit at different points at the same time, and some should remain human-led.</p>
        </div>
        <ul className={styles.responsibilities}>
          {responsibilities.map(([label, title, description]) => (
            <li key={label}>
              <span>{label}</span>
              <strong>{title}</strong>
              <p>{description}</p>
            </li>
          ))}
        </ul>
      </section>

      <ol className={styles.learning} aria-label="Test, observe and reprioritise">
        {learning.map(([number, label, description]) => (
          <li key={number}>
            <span className={styles.stepMeta}>{number} / {label}</span>
            <p>{description}</p>
          </li>
        ))}
      </ol>
      <p className={styles.feedback}><span aria-hidden="true">↺</span> Evidence returns to the opportunity landscape. People review and govern any change to the workflow or its boundaries.</p>
    </ServiceSection>
  );
}
