import { ServiceSection, ServiceSectionHeader } from "@/components/services/ServiceSection/ServiceSection";
import styles from "./GovernanceTension.module.css";

const tooLittle = [
  "Fragmentation",
  "Unclear ownership",
  "Repeated decisions",
  "Inconsistent outcomes",
];

const tooMuch = [
  "Bottlenecks",
  "Permission seeking",
  "Slow contribution",
  "Local context gets ignored",
];

export function GovernanceTension() {
  return (
    <ServiceSection width="full" labelledBy="governance-tension-title" className={styles.section}>
      <div className={styles.inner}>
        <ServiceSectionHeader
          eyebrow="THE GOVERNANCE TENSION"
          title="Enough structure to support good decisions."
          description="Too little structure creates avoidable friction. Too much makes change costly. The useful balance depends on the organisation, the teams, the work and its consequences."
          titleId="governance-tension-title"
          className={styles.header}
          eyebrowClassName={styles.eyebrow}
          descriptionClassName={styles.description}
        />

        <div className={styles.model}>
          <article className={styles.pole}>
            <p className={styles.poleLabel}>TOO LITTLE GOVERNANCE</p>
            <ul>{tooLittle.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>

          <div className={styles.context}>
            <span>CONTEXTUAL FIT</span>
            <h3>What structure helps these people make good decisions here?</h3>
            <p>Lightweight decisions reduce unnecessary cost while preserving quality. There is no single correct level of control for every system.</p>
          </div>

          <article className={`${styles.pole} ${styles.poleRight}`}>
            <p className={styles.poleLabel}>TOO MUCH GOVERNANCE</p>
            <ul>{tooMuch.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
        </div>
      </div>
    </ServiceSection>
  );
}
