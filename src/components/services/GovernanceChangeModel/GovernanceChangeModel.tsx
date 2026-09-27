import { ServiceSection, ServiceSectionHeader } from "@/components/services/ServiceSection/ServiceSection";
import styles from "./GovernanceChangeModel.module.css";

const outcomes = [
  ["03", "MAKE THE CHANGE", "Put the decision into practice in the system."],
  ["04", "DOCUMENT + COMMUNICATE", "Make the change and its rationale visible to the people who depend on it."],
  ["05", "OBSERVE", "Notice whether the change works in real use, and where new friction appears."],
  ["06", "EVOLVE THE RULES", "Use evidence, including repeated exceptions, to review whether the guidance still fits."],
] as const;

export function GovernanceChangeModel() {
  return (
    <ServiceSection width="wide" labelledBy="governance-change-title" className={styles.section}>
      <ServiceSectionHeader
        eyebrow="DECISION + CHANGE"
        title="Make change navigable, including when it doesn’t fit."
        description="Good governance makes the established route clear and gives unfamiliar situations a way forward. An exception can be evidence that the guidance needs to evolve."
        titleId="governance-change-title"
        className={styles.header}
      />

      <div className={styles.model}>
        <ol className={styles.entry} aria-label="Change enters the governance process">
          <li>
            <span>01 / CHANGE OR NEED</span>
            <strong>A change is needed</strong>
          </li>
          <li>
            <span>02 / OWNERSHIP</span>
            <strong>Who owns this decision?</strong>
          </li>
        </ol>

        <div className={styles.branches} aria-label="Two equally valid routes for a change">
          <article className={styles.route}>
            <span className={styles.routeLabel}>ESTABLISHED PATH</span>
            <h3>Act within the agreed guidance.</h3>
            <p>Clear principles and ownership help familiar changes move forward without unnecessary delay.</p>
          </article>
          <article className={styles.route}>
            <span className={styles.routeLabel}>EXCEPTION OR UNKNOWN</span>
            <h3>Review the context and decide together.</h3>
            <p>An exception is not automatically non-compliance. It may call for a considered adaptation, a test, or a change to the guidance itself.</p>
          </article>
        </div>

        <div className={styles.convergence} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <ol className={styles.outcomes} aria-label="Act, observe and evolve governance">
          {outcomes.map(([number, label, description]) => (
            <li key={number}>
              <span>{number} / {label}</span>
              <p>{description}</p>
            </li>
          ))}
        </ol>

        <p className={styles.feedback}><span aria-hidden="true">↺</span> Repeated exceptions and real-world outcomes feed back into the rules, so governance stays appropriate as the system changes.</p>
      </div>
    </ServiceSection>
  );
}
