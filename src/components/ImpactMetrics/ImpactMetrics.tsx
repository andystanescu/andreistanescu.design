import styles from "./ImpactMetrics.module.css";

export type ImpactMetric = {
  value: string;
  label: string;
};

type ImpactMetricsProps = {
  metrics: ImpactMetric[];
  tone?: "default" | "on-deep";
  label?: string;
};

export function ImpactMetrics({ metrics, tone = "default", label = "Impact metrics" }: ImpactMetricsProps) {
  if (metrics.length === 0) return null;

  return (
    <div className={`${styles.grid} ${tone === "on-deep" ? styles.onDeep : ""}`} role="list" aria-label={label}>
      {metrics.map((metric, index) => (
        <div className={styles.metric} role="listitem" key={`${metric.value}-${metric.label}-${index}`}>
          <strong>{metric.value}</strong>
          <span>{metric.label}</span>
        </div>
      ))}
    </div>
  );
}
