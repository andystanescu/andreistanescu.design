import type { ReactNode } from "react";
import styles from "./EmbedWrapper.module.css";

export function EmbedWrapper({ children, label, help, unbounded = false }: { children: ReactNode; label?: string; help?: string; unbounded?: boolean }) {
  return <figure className={styles.embed}>
    {label && <div className={styles.label}>{label}</div>}
    <div className={`${styles.viewport} ${unbounded ? styles.unbounded : ""}`}>{children}</div>
    {help && <figcaption className={styles.help}>{help}</figcaption>}
  </figure>;
}
