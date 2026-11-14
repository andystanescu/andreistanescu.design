import type { EngagementOverview as OverviewData, OverviewRange } from "@/lib/engagementOverview";
import { overviewShare } from "@/lib/engagementOverview";
import styles from "./EngagementOverview.module.css";

type Metric = { label: string; value: number | null; detail: string; progress: number | null; previous: number | null; accent?: boolean };

export function EngagementOverview({ data, range }: { data: OverviewData; range: OverviewRange }) {
  const { current, previous, comparisonAvailable, trackingStart } = data;
  const enoughSessions = current.sessions >= 20;
  const engagedShare = overviewShare(current.engaged, current.sessions);
  const deepShare = overviewShare(current.deep, current.engaged);
  const tracked = Boolean(trackingStart);
  const comparisons = comparisonAvailable ? previous : null;
  const metrics: Metric[] = [
    { label: "Likely-human sessions", value: tracked ? current.sessions : null, detail: "Browser-tab sessions · uncertain and bots excluded", progress: tracked && current.sessions > 0 ? 100 : null, previous: comparisons?.sessions ?? null },
    { label: "Meaningfully engaged", value: tracked ? current.engaged : null, detail: engagedShare === null ? "Share unavailable · fewer than 20 sessions" : `${engagedShare}% of likely-human sessions`, progress: engagedShare, previous: comparisons?.engaged ?? null },
    { label: "Deep engagements", value: tracked ? current.deep : null, detail: deepShare === null ? "Share unavailable · fewer than 20 engaged sessions" : `${deepShare}% of engaged sessions`, progress: deepShare, previous: comparisons?.deep ?? null },
    { label: "Contact enquiries", value: current.enquiries, detail: "Accepted, non-blocked submissions", progress: null, previous: null, accent: true },
  ];
  const period = range === "all" ? "All time" : `Last ${range.slice(0, -1)} days`;
  return <div className={styles.card}>
    <div className={styles.header}><h2 id="engagement-overview">Engagement overview</h2><p>{tracked ? `${current.pageViews.toLocaleString()} tracked page views in likely-human sessions started in this period` : "No engagement tracking data yet"} · {period}</p></div>
    <div className={styles.grid}>{metrics.map((metric) => {
      const comparable = metric.value !== null && metric.previous !== null && metric.value >= 20 && metric.previous >= 20;
      const difference = comparable ? Math.round(((metric.value! - metric.previous!) / metric.previous!) * 100) : 0;
      return <div className={styles.cell} key={metric.label}>
        <div className={styles.cellTop}><div className={styles.labelGroup}><h3>{metric.label}</h3><p className={styles.mobileDetail}>{metric.detail}</p></div><div className={styles.numberRow}>{comparable && <span className={`${styles.change} ${difference < 0 ? styles.down : difference > 0 ? styles.up : ""}`} aria-label={`${difference > 0 ? "Up" : difference < 0 ? "Down" : "Unchanged"} ${Math.abs(difference)} percent versus the previous equivalent period`}>{difference > 0 ? "▲ +" : difference < 0 ? "▼ −" : ""}{Math.abs(difference)}%</span>}<strong className={styles.value}>{metric.value === null ? "—" : metric.value.toLocaleString()}</strong></div></div>
        {metric.progress !== null && <div className={styles.track} role="progressbar" aria-label={metric.label === "Likely-human sessions" ? "Baseline of likely-human sessions" : metric.detail} aria-valuemin={0} aria-valuemax={100} aria-valuenow={metric.progress}><span style={{ width: `${metric.progress}%` }} /></div>}
        <p className={styles.desktopDetail}>{metric.detail}</p>
        {metric.accent && <p className={styles.extra}>Not matched to sessions; no conversion rate available.</p>}
      </div>;
    })}</div>
    {tracked && !enoughSessions && <p className={styles.sampleNote}>Early data: percentages and comparisons are hidden until the sample is large enough.</p>}
  </div>;
}
