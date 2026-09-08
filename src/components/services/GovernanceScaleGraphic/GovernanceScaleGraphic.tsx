import styles from "@/app/services/[slug]/service-detail.module.css";

const teams = [
  { label: "PRODUCT", x: 92, y: 100, active: 2 },
  { label: "DESIGN", x: 92, y: 240, active: 3 },
  { label: "ENGINEERING", x: 588, y: 100, active: 2 },
  { label: "OPERATIONS", x: 588, y: 240, active: 5 },
];

function TeamNode({ label, x, y, active }: (typeof teams)[number]) {
  return <g>
    <circle className={styles.governanceTeam} cx={x} cy={y} r="50" />
    {[0, 1, 2].map((row) => [0, 1, 2].map((column) => {
      const index = row * 3 + column;
      return <circle key={`${label}-${index}`} className={index === active ? styles.governanceDotActive : styles.governanceDot} cx={x - 12 + column * 12} cy={y - 12 + row * 12} r="3" />;
    }))}
    <text className={styles.governanceTeamLabel} x={x} y={y + 31} textAnchor="middle">{label}</text>
  </g>;
}

export function GovernanceScaleGraphic() {
  return <div className={styles.governanceScaleGraphic} role="img" aria-label="Product, Design, Engineering and Operations connected through shared principles and a contribution loop.">
    <svg viewBox="0 0 680 340" aria-hidden="true">
      <defs><marker id="governance-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0 6 3 0 6Z" /></marker></defs>
      <path className={styles.governanceConnector} d="M142 100 C205 100 220 135 274 135" />
      <path className={styles.governanceConnector} d="M142 240 C205 240 220 205 274 205" />
      <path className={styles.governanceConnector} d="M538 100 C475 100 460 135 406 135" />
      <path className={styles.governanceConnector} d="M538 240 C475 240 460 205 406 205" />
      <path className={styles.governanceLoop} d="M92 50 V18 H588 V50" markerEnd="url(#governance-arrow)" />
      <path className={styles.governanceLoop} d="M588 290 V322 H92 V290" markerEnd="url(#governance-arrow)" />
      <circle className={styles.governancePort} cx="92" cy="50" r="4" /><circle className={styles.governancePort} cx="588" cy="50" r="4" />
      <circle className={styles.governancePort} cx="92" cy="290" r="4" /><circle className={styles.governancePort} cx="588" cy="290" r="4" />
      {teams.map((team) => <TeamNode key={team.label} {...team} />)}
      <circle className={styles.governanceCoreHalo} cx="340" cy="170" r="78" />
      <circle className={styles.governanceCore} cx="340" cy="170" r="63" />
      {[0, 1, 2].map((row) => [0, 1, 2].map((column) => <circle key={`core-${row}-${column}`} className={styles.governanceCoreDot} cx={328 + column * 12} cy={144 + row * 12} r="3" />))}
      <text className={styles.governanceCoreLabel} x="340" y="202" textAnchor="middle">SHARED</text>
      <text className={styles.governanceCoreLabel} x="340" y="215" textAnchor="middle">PRINCIPLES</text>
      <text className={styles.governanceMeta} x="340" y="13" textAnchor="middle">CONTRIBUTE</text>
      <text className={styles.governanceMeta} x="340" y="338" textAnchor="middle">APPLY · IMPROVE</text>
    </svg>
  </div>;
}
