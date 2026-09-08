type Point = [number, number];

const points: Point[] = [
  [8, 8], [22, 8], [36, 8],
  [8, 22], [22, 22], [36, 22],
  [8, 36], [22, 36], [36, 36],
];

const patterns: number[][] = [
  [4],
  [0, 4],
  [0, 4, 8],
  [0, 2, 4, 6],
];

export function LatticeBenefitIcon({ index }: { index: number }) {
  const selected = patterns[index % patterns.length];
  return (
    <svg
      viewBox="0 0 44 44"
      role="img"
      aria-label={`${selected.length} highlighted lattice node${selected.length === 1 ? "" : "s"}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {selected.length > 1 && selected.slice(0, -1).map((pointIndex, i) => {
        const [x1, y1] = points[pointIndex];
        const [x2, y2] = points[selected[i + 1]];
        return <line key={`${pointIndex}-${selected[i + 1]}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--benefit-line, #77818d)" strokeWidth="1.2" />;
      })}
      {points.map(([cx, cy], pointIndex) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={selected.includes(pointIndex) ? 3.4 : 2.1} fill={selected.includes(pointIndex) ? "var(--benefit-accent, #ff8a66)" : "var(--benefit-dot, #f7f6f2)"} />
      ))}
    </svg>
  );
}
