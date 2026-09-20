import type { ReactNode } from "react";
import styles from "./Callout.module.css";

export type CalloutVariant = "note" | "decision" | "outcome" | "constraint";

const labels: Record<CalloutVariant, string> = { note: "Note", decision: "Decision", outcome: "Outcome", constraint: "Constraint" };

export function Callout({ children, variant = "note", title }: { children: ReactNode; variant?: CalloutVariant; title?: string }) {
  const label = title || labels[variant];
  return <aside className={`${styles.callout} ${styles[variant]}`} aria-label={label} data-callout={variant}>
    <strong>{label}</strong>
    <div>{children}</div>
  </aside>;
}
