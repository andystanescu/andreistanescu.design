import styles from "./ProcessStepper.module.css";

export type ProcessStep = {
  id: string | number;
  title: string;
  description: string;
  icon?: string;
};

type ProcessStepperProps = {
  steps: ProcessStep[];
  label?: string;
};

export function ProcessStepper({ steps, label = "Process" }: ProcessStepperProps) {
  return (
    <ol className={styles.steps} aria-label={label}>
      {steps.map((step, index) => (
        <li key={step.id} className={styles.step}>
          <div className={styles.markerRow}>
            <span className={styles.marker} aria-hidden="true" />
            <p className={`mono-token ${styles.number}`}>
              {String(index + 1).padStart(2, "0")}
            </p>
          </div>
          <div className={styles.content}>
            <h3 className="heading-03">{step.title}</h3>
            <p className={`body-small ${styles.description}`}>{step.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
