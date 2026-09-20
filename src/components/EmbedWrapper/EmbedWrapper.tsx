import type { ReactNode } from "react";
import styles from "./EmbedWrapper.module.css";

export function EmbedWrapper({ children, label, help }: { children: ReactNode; label?: string; help?: string }) {
  return <figure className={styles.embed}>
    {label && <div className={styles.label}>{label}</div>}
    <div className={styles.viewport}>{children}</div>
    {help && <figcaption className={styles.help}>{help}</figcaption>}
  </figure>;
}
