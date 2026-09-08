import styles from "@/app/services/[slug]/service-detail.module.css";

const stages: { label: string; x: number; y: number; active: number[] }[] = [
  { label: "SIGNAL", x: 82, y: 150, active: [4] },
  { label: "SUGGESTION", x: 252, y: 122, active: [1, 4, 7] },
  { label: "JUDGEMENT", x: 422, y: 94, active: [0, 4, 8] },
  { label: "IMPROVEMENT", x: 592, y: 66, active: [0, 1, 4, 7, 8] },
];

export function AiOperationsGraphic() {
  return (
    <div className={styles.aiOperationsGraphic} role="img" aria-label="A lattice-inspired AI operations loop moving from signal to suggestion, judgement and improvement, with a feedback path for learning and refinement.">
      <svg viewBox="0 0 680 360" aria-hidden="true">
        <defs>
          <marker id="ai-operations-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0 6 3 0 6Z" /></marker>
        </defs>
        <path className={styles.aiOperationsLoop} d="M82 150 C130 110 190 165 252 122 C310 80 370 135 422 94 C480 55 545 110 592 66" markerEnd="url(#ai-operations-arrow)" />
        <path className={styles.aiOperationsFeedback} d="M592 66 V292 H82 V150" markerEnd="url(#ai-operations-arrow)" />
        {stages.map((stage) => (
          <g key={stage.label}>
            <path className={styles.aiOperationsGrid} d={`M${stage.x - 27} ${stage.y - 27}H${stage.x + 27}M${stage.x - 27} ${stage.y}H${stage.x + 27}M${stage.x - 27} ${stage.y + 27}H${stage.x + 27}M${stage.x - 27} ${stage.y - 27}V${stage.y + 27}M${stage.x} ${stage.y - 27}V${stage.y + 27}M${stage.x + 27} ${stage.y - 27}V${stage.y + 27}`} />
            {[0, 1, 2].map((row) => [0, 1, 2].map((column) => {
              const index = row * 3 + column;
              return <circle key={`${stage.label}-${index}`} className={stage.active.includes(index) ? styles.aiOperationsDotActive : styles.aiOperationsDot} cx={stage.x - 27 + column * 27} cy={stage.y - 27 + row * 27} r="4" />;
            }))}
            <text className={styles.aiOperationsStage} x={stage.x} y={stage.y + 66} textAnchor="middle">{stage.label}</text>
          </g>
        ))}
        <text className={styles.aiOperationsMeta} x="340" y="331" textAnchor="middle">LEARN · VALIDATE · REFINE</text>
      </svg>
    </div>
  );
}
