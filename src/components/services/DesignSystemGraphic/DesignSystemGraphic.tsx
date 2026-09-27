import styles from "@/app/services/[slug]/service-detail.module.css";

const legend = [
  ["Guidance", "How to use it well"],
  ["Components", "What people build with"],
  ["Patterns", "Common solutions"],
  ["Tokens", "Visual language"],
  ["Foundations", "Principles and rules"],
  ["Governance", "How it evolves"],
] as const;

const layers = [
  { key: "governance", x: 133, y: 258, className: styles.designSystemLayerGovernance },
  { key: "foundations", x: 113, y: 214, className: styles.designSystemLayerFoundations },
  { key: "tokens", x: 95, y: 170, className: styles.designSystemLayerTokens },
  { key: "patterns", x: 72, y: 126, className: styles.designSystemLayerPatterns },
  { key: "components", x: 52, y: 82, className: styles.designSystemLayerComponents },
  { key: "guidance", x: 35, y: 38, className: styles.designSystemLayerGuidance },
] as const;

const connectors = [
  { x: 284, y: 100.5, radius: 2.5 },
  { x: 301, y: 144.5, radius: 2.5 },
  { x: 321, y: 189, radius: 3 },
  { x: 347, y: 233, radius: 3 },
  { x: 365.5, y: 276.5, radius: 3.5 },
  { x: 381.5, y: 320, radius: 3.5 },
] as const;

export function DesignSystemGraphic() {
  return (
    <figure
      className={styles.designSystemGraphic}
      role="img"
      aria-label="A layered design system model showing guidance, components, patterns, tokens, foundations and governance."
    >
      <div className={styles.designSystemGraphicDiagram}>
        <svg
          className={styles.designSystemLayerPlot}
          viewBox="0 0 445 382"
          aria-hidden="true"
          preserveAspectRatio="xMidYMid meet"
        >
          {layers.map((layer) => (
            <polygon
              key={layer.key}
              className={layer.className}
              points="124.5,0 249,62.5 124.5,125 0,62.5"
              transform={`translate(${layer.x} ${layer.y})`}
            />
          ))}
          {connectors.map((connector, index) => (
            <g key={`${connector.x}-${connector.y}`}>
              <line
                className={styles.designSystemLeaderRail}
                x1={connector.x}
                y1={connector.y}
                x2="445"
                y2={connector.y}
              />
              <line
                className={styles.designSystemLeader}
                x1={connector.x}
                y1={connector.y}
                x2="445"
                y2={connector.y}
              />
              <circle
                className={index < 2 ? styles.designSystemNodeMuted : styles.designSystemNode}
                cx={connector.x}
                cy={connector.y}
                r={connector.radius}
              />
            </g>
          ))}
        </svg>
        <ol className={styles.designSystemLegend} aria-hidden="true">
          {legend.map(([title, description]) => (
            <li key={title}>
              <span className={styles.designSystemLegendBullet} />
              <strong>{title}</strong>
              <small>{description}</small>
            </li>
          ))}
        </ol>
      </div>
    </figure>
  );
}
