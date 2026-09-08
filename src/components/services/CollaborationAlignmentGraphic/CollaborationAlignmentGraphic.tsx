import styles from "@/app/services/[slug]/service-detail.module.css";

const groups = [
  { label: "LISTEN", x: 92, y: 82, active: 5 },
  { label: "ALIGN", x: 92, y: 254, active: 3 },
  { label: "FRAME", x: 588, y: 82, active: 7 },
  { label: "COMMIT", x: 588, y: 254, active: 3 },
] as const;

function GroupNode({ label, x, y, active }: (typeof groups)[number]) {
  return <g>
    <text className={styles.collaborationGroupLabel} x={x} y={y - 65} textAnchor="middle">{label}</text>
    {[0, 1, 2].map((row) => [0, 1, 2].map((column) => {
      const index = row * 3 + column;
      return <circle key={`${label}-${index}`} className={index === active ? styles.collaborationDotActive : styles.collaborationDot} cx={x - 28 + column * 28} cy={y - 28 + row * 28} r="11" />;
    }))}
  </g>;
}

export function CollaborationAlignmentGraphic() {
  return <div className={styles.collaborationAlignmentGraphic} role="img" aria-label="Listen, Align, Frame and Commit connected through a shared direction.">
    <svg viewBox="0 0 680 340" aria-hidden="true">
      <defs><marker id="collaboration-arrow" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto"><path d="M0 0 7 3.5 0 7Z" /></marker></defs>
      <path className={styles.collaborationConnector} d="M148 82 C218 82 233 119 283 138" />
      <path className={styles.collaborationConnector} d="M148 254 C218 254 233 221 283 202" />
      <path className={styles.collaborationConnector} d="M532 82 C462 82 447 119 397 138" />
      <path className={styles.collaborationConnector} d="M532 254 C462 254 447 221 397 202" />
      <path className={styles.collaborationOrangePath} d="M120 82 C196 84 232 107 300 150" markerEnd="url(#collaboration-arrow)" />
      <path className={styles.collaborationOrangePath} d="M120 254 C196 254 232 229 300 190" markerEnd="url(#collaboration-arrow)" />
      <path className={styles.collaborationOrangePath} d="M560 82 C484 84 448 107 380 150" markerEnd="url(#collaboration-arrow)" />
      <path className={styles.collaborationOrangePath} d="M560 254 C484 254 448 229 380 190" markerEnd="url(#collaboration-arrow)" />
      {groups.map((group) => <GroupNode key={group.label} {...group} />)}
      <circle className={styles.collaborationCoreHalo} cx="340" cy="170" r="68" />
      <circle className={styles.collaborationCore} cx="340" cy="170" r="54" />
      {[0, 1, 2].map((row) => [0, 1, 2].map((column) => <circle key={`core-${row}-${column}`} className={styles.collaborationCoreDot} cx={326 + column * 14} cy={146 + row * 14} r="4" />))}
      <text className={styles.collaborationCoreLabel} x="340" y="202" textAnchor="middle">SHARED</text>
      <text className={styles.collaborationCoreLabel} x="340" y="216" textAnchor="middle">DIRECTION</text>
      <path className={styles.collaborationDirectionPath} d="M398 170 H484" markerEnd="url(#collaboration-arrow)" />
      <rect className={styles.collaborationDirection} x="494" y="139" width="136" height="62" rx="31" />
      <text className={styles.collaborationDirectionLabel} x="562" y="166" textAnchor="middle">SHARED</text>
      <text className={styles.collaborationDirectionLabel} x="562" y="181" textAnchor="middle">DIRECTION</text>
      <path className={styles.collaborationLoop} d="M120 54 V16 H560 V54" markerEnd="url(#collaboration-arrow)" />
      <path className={styles.collaborationLoop} d="M588 294 V320 H92 V294" markerEnd="url(#collaboration-arrow)" />
      <circle className={styles.collaborationLoopPort} cx="120" cy="54" r="4" /><circle className={styles.collaborationLoopPort} cx="560" cy="54" r="4" />
      <text className={styles.collaborationMeta} x="340" y="11" textAnchor="middle">CONTRIBUTE</text>
      <text className={styles.collaborationMeta} x="340" y="337" textAnchor="middle">ALIGN · COMMIT · MOVE</text>
    </svg>
  </div>;
}
