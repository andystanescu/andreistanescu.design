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
        <li className={styles.step} key={step.id}>
          {step.icon && (
            // Process icons can be uploaded through the CMS and do not have stable dimensions at build time.
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.icon} src={step.icon} alt="" />
          )}
          <div className={styles.rail} aria-hidden="true">
            <span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>
            <i className={styles.node} />
          </div>
          <div className={styles.copy}>
            <h3 className="heading-03">{step.title}</h3>
            <p className="body-small">{step.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
