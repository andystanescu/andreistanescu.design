import styles from "@/app/services/[slug]/service-detail.module.css";

const deliverables = [
  ["Tokens", "The foundations"],
  ["Components", "Reusable building blocks"],
  ["Patterns", "Proven behaviours"],
  ["Accessibility", "Inclusive by default"],
  ["Documentation", "Shared understanding"],
  ["Governance", "Sustainable evolution"],
] as const;

export function DesignSystemGraphic() {
  return (
    <div
      className={styles.designSystemGraphic}
      role="img"
      aria-label="A connected design system ecosystem linking shared design language to tokens, components, patterns, accessibility, documentation and governance."
    >
      <div className={styles.designSystemGraphicMeta}>
        <span>DESIGN SYSTEMS</span>
        <span>CONNECTED ECOSYSTEM</span>
      </div>
      <div className={styles.designSystemGraphicMap}>
        <svg viewBox="0 0 640 360" aria-hidden="true" preserveAspectRatio="none">
          <path d="M320 180 112 70M320 180 470 70M320 180 76 180M320 180 492 180M320 180 112 290M320 180 470 290" />
          <circle cx="320" cy="180" r="7" />
          <circle cx="112" cy="70" r="5" />
          <circle cx="76" cy="180" r="5" />
          <circle cx="112" cy="290" r="5" />
        </svg>
        <div className={styles.designSystemGraphicCore}>
          <span>SHARED DESIGN LANGUAGE</span>
          <strong>One system<br />many expressions</strong>
        </div>
        {deliverables.map(([title, description], index) => (
          <div key={title} className={`${styles.designSystemGraphicNode} ${styles[`designSystemGraphicNode${index}`]}`}>
            <span>0{index + 1}</span>
            <strong>{title}</strong>
            <small>{description}</small>
          </div>
        ))}
      </div>
      <div className={styles.designSystemGraphicFooter}>
        <span>FROM FOUNDATIONS TO ADOPTION</span>
        <span aria-hidden="true">↗</span>
      </div>
    </div>
  );
}
