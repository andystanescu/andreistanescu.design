import { ServiceSection, ServiceSectionHeader } from "@/components/services/ServiceSection/ServiceSection";
import { GovernanceRecognition } from "@/components/services/GovernanceRecognition/GovernanceRecognition";
import styles from "@/app/services/[slug]/service-detail.module.css";

export function ServiceRecognition({ template, title, signals, onTitleChange, onSignalChange }: { template: string; title: string; signals: string[]; onTitleChange?: (value: string) => void; onSignalChange?: (index: number, value: string) => void }) {
  if (template === "governance-scale") return <GovernanceRecognition title={title} signals={signals} onTitleChange={onTitleChange} onSignalChange={onSignalChange} />;
  const architecture = template === "product-architecture";
  const ai = template === "ai-enabled-design-operations";
  const collaboration = template === "collaboration-alignment";
  return <ServiceSection labelledBy="service-recognition-title" width={template === "design-systems" ? "contained" : "wide"} className={`${styles.recognition} ${architecture ? styles.productArchitectureRecognition : ""} ${ai ? styles.aiOperationsRecognition : ""} ${collaboration ? styles.collaborationRecognition : ""}`}>
    <ServiceSectionHeader eyebrow="RECOGNITION" title={onTitleChange ? <span contentEditable="plaintext-only" suppressContentEditableWarning role="textbox" aria-label="Recognition heading" onBlur={(event) => onTitleChange(event.currentTarget.textContent?.trim() ?? "")}>{title}</span> : title} titleId="service-recognition-title" className={styles.recognitionHeader} />
    <ol className={`${styles.recognitionList} ${architecture ? styles.productArchitectureRecognitionList : ""} ${ai ? styles.aiOperationsRecognitionList : ""} ${collaboration ? styles.collaborationRecognitionList : ""}`}>
      {signals.map((signal, index) => <li key={index}><span className={styles.recognitionNumber}>{String(index + 1).padStart(2, "0")}</span><p contentEditable={onSignalChange ? "plaintext-only" : undefined} suppressContentEditableWarning={Boolean(onSignalChange)} role={onSignalChange ? "textbox" : undefined} aria-label={onSignalChange ? `Recognition statement ${index + 1}` : undefined} onBlur={onSignalChange ? (event) => onSignalChange(index, event.currentTarget.textContent?.trim() ?? "") : undefined}>{signal}</p></li>)}
    </ol>
    {ai && <div className={styles.aiSignalsConvergence} aria-hidden="true"><svg viewBox="0 0 1200 100" preserveAspectRatio="none"><path d="M70 0 L600 72 M282 0 L600 72 M494 0 L600 72 M706 0 L600 72 M918 0 L600 72 M1130 0 L600 72 M600 72 L600 100" /><circle cx="600" cy="72" r="4" /><path className={styles.aiSignalsArrow} d="M594 94 L600 100 L606 94" /></svg></div>}
  </ServiceSection>;
}
