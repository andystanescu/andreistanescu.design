import type { AssessmentActivityCategory } from "@/data/caseStudyAssessment";
import styles from "./case-study.module.css";

const STATUS_LABELS = { completed: "Completed", not_completed: "Not completed", not_started: "Not started" } as const;

export function EngagementActivities({ categories }: { categories: AssessmentActivityCategory[] }) {
  const visible = categories.map((category) => ({ ...category, activities: category.activities.filter((item) => item.title.trim()) })).filter((category) => category.activities.length);
  if (!visible.length) return <p className="body-small">No engagement activities have been recorded.</p>;
  return <div className={styles.activityCategories}>{visible.map((category) => <section className={styles.activityCategory} key={category.id}>
    <h4 className="heading-04">{category.title.trim() || "Activities"}</h4>
    <div className={styles.activityCards}>{category.activities.map((item) => <article className={styles.activityCard} key={item.id}>
      <div className={styles.activityCardHeader}><h5>{item.title}</h5><span className={item.status === "completed" ? styles.statusComplete : styles.statusIncomplete}>{STATUS_LABELS[item.status]}</span></div>
      {item.description && <p>{item.description}</p>}
    </article>)}</div>
  </section>)}</div>;
}
