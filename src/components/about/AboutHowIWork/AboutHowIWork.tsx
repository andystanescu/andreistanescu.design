import { getApproachSteps } from "@/lib/approachSteps";
import { getSettings } from "@/lib/settings";
import styles from "./AboutHowIWork.module.css";

export function AboutHowIWork() {
  const steps = getApproachSteps();
  const settings = getSettings();
  return (
    <section id="how-i-work" className={`container ${styles.section}`}>
      <p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>{settings.approach_how_eyebrow || "HOW I WORK"}</p>
      <h2 className="heading-01">{settings.approach_how_title}</h2>
      {steps.length > 0 ? <ol className={styles.steps}>{steps.map((step, index) => <li key={step.id} className={styles.step}><div className={styles.rule} /><p className="mono-token" style={{ color: "var(--text-accent)" }}>{String(index + 1).padStart(2, "0")}</p><h3 className="heading-03">{step.title}</h3><p className="body-small" style={{ color: "var(--text-secondary)" }}>{step.description}</p></li>)}</ol> : <p className="body-default" style={{ color: "var(--text-tertiary)" }}>My approach is on its way — check back soon.</p>}
    </section>
  );
}
