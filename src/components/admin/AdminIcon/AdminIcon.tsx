import type { CSSProperties } from "react";
import styles from "./AdminIcon.module.css";

/** Lattice icons are monochrome masks so they follow the current admin theme. */
export function AdminIcon({ name, className = "" }: { name: string; className?: string }) {
  const style = { "--admin-icon-image": `url("/assets/lattice/${name}.svg")` } as CSSProperties;
  return <i aria-hidden="true" className={`${styles.icon} ${className}`} style={style} />;
}
