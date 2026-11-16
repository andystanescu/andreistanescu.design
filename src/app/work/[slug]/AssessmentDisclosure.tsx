"use client";

import type { ReactNode } from "react";
import styles from "./case-study.module.css";

type Dimension = { label: string; score: number };

export function AssessmentDisclosure({ overall, interpretation, dimensions, children }: { overall: string; interpretation: string; dimensions: Dimension[]; children: ReactNode }) {
  return <details id="assessment-overview" className={styles.assessmentDisclosure} data-story-entrance>
    <summary className={styles.assessmentCompact}>
      <span className={styles.assessmentCompactEyebrow}>Assessment</span>
      <strong>{overall || "Complexity assessment"}</strong>
      <span className={styles.assessmentCompactScores} role="list" aria-label="Complexity dimension scores">
        {dimensions.map((dimension) => <span role="listitem" key={dimension.label} aria-label={`${dimension.label}: ${dimension.score || 0} out of 5`}>
          <span>{dimension.label}</span>
          <i><b style={{ width: `${Math.min(100, (dimension.score / 5) * 100)}%` }} /></i>
        </span>)}
      </span>
      {interpretation && <span className={styles.assessmentCompactInterpretation}>{interpretation}</span>}
      <span className={styles.assessmentCompactAction}><span className={styles.showFull}>View engagement activities</span><span className={styles.showLess}>Hide engagement activities</span><b aria-hidden="true"><span className={styles.showFull}>+</span><span className={styles.showLess}>−</span></b></span>
    </summary>
    <div className={styles.assessmentDetail}>{children}</div>
  </details>;
}
