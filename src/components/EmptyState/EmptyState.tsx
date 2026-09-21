import type { ReactNode } from "react";
import styles from "./EmptyState.module.css";

export function EmptyState({ eyebrow = "Nothing to show", title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <section className={styles.empty} role="status">
    <span className={styles.eyebrow}>{eyebrow}</span>
    <h2 className={styles.title}>{title}</h2>
    {description && <p>{description}</p>}
    {action && <div className={styles.action}>{action}</div>}
  </section>;
}
