import { ServiceSection, ServiceSectionHeader } from "@/components/services/ServiceSection/ServiceSection";
import styles from "./GovernanceRecognition.module.css";

export function GovernanceRecognition({ title, signals, onTitleChange, onSignalChange }: { title: string; signals: string[]; onTitleChange?: (value: string) => void; onSignalChange?: (index: number, value: string) => void }) {
  return (
    <ServiceSection width="wide" labelledBy="governance-recognition-title" className={styles.section}>
      <div className={styles.layout}>
        <ServiceSectionHeader
          eyebrow="RECOGNITION"
          title={onTitleChange ? <span contentEditable="plaintext-only" suppressContentEditableWarning role="textbox" aria-label="Recognition heading" onBlur={(event) => onTitleChange(event.currentTarget.textContent?.trim() ?? "")}>{title}</span> : title}
          titleId="governance-recognition-title"
          className={styles.header}
        />
        <div className={styles.signalsColumn}>
          <p className={styles.signalsLabel}>DECISION FRICTION</p>
          <ol className={styles.signals}>
            {signals.map((signal, index) => (
              <li key={index}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p contentEditable={onSignalChange ? "plaintext-only" : undefined} suppressContentEditableWarning={Boolean(onSignalChange)} role={onSignalChange ? "textbox" : undefined} aria-label={onSignalChange ? `Recognition statement ${index + 1}` : undefined} onBlur={onSignalChange ? (event) => onSignalChange(index, event.currentTarget.textContent?.trim() ?? "") : undefined}>{signal}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </ServiceSection>
  );
}
