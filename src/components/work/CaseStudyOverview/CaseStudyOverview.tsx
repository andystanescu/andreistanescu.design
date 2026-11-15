import type { CaseStudyOverview as Overview } from "@/lib/caseStudyOverview";
import styles from "./CaseStudyOverview.module.css";

export function CaseStudyOverview({ overview, target, followsOutcomes = false }: { overview: Overview; target: string; followsOutcomes?: boolean }) {
  const rows = [["The situation", overview.situation], ["What I did", overview.contribution], ["What changed", overview.change]].filter(([, value]) => value.trim());
  if (!rows.length && !overview.title) return null;
  return <section className={`${styles.wrapper} section-dark ${followsOutcomes ? styles.withSeparator : ""}`} aria-label={overview.eyebrow}>
    <div className="container">
    <div className={styles.overview} data-story-entrance>
      <p className={`label-eyebrow ${styles.eyebrow}`}>{overview.eyebrow}</p>
      {overview.title && <h2 className={`heading-02 ${styles.title}`}>{overview.title}</h2>}
      <dl className={styles.rows}>{rows.map(([label, value]) => <div className={styles.row} key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <div className={styles.footer}><a href={`#${target}`}>Read the full case study</a></div>
    </div>
    </div>
  </section>;
}
