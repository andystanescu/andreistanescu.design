import { ServiceSection, ServiceSectionHeader } from "@/components/services/ServiceSection/ServiceSection";
import styles from "./GovernanceRecognition.module.css";

const signals = [
  "Everyone knows something needs to change, but nobody knows who can decide.",
  "Small contributions require too many conversations.",
  "Different teams interpret the same standards differently.",
  "Exceptions accumulate without ever changing the underlying rule.",
  "The people maintaining the system have responsibility without authority.",
  "Decisions are made, but nobody can find out later why they were made.",
];

export function GovernanceRecognition() {
  return (
    <ServiceSection width="wide" labelledBy="governance-recognition-title" className={styles.section}>
      <div className={styles.layout}>
        <ServiceSectionHeader
          eyebrow="RECOGNITION"
          title="A system becomes harder to sustain when…"
          titleId="governance-recognition-title"
          className={styles.header}
        />
        <div className={styles.signalsColumn}>
          <p className={styles.signalsLabel}>DECISION FRICTION</p>
          <ol className={styles.signals}>
            {signals.map((signal, index) => (
              <li key={signal}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{signal}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </ServiceSection>
  );
}
