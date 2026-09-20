import type { ReactNode } from "react";
import styles from "./MediaContainer.module.css";

export type MediaVariant = "contained" | "wide" | "bleed";

export function MediaContainer({ children, variant = "contained", className = "" }: { children: ReactNode; variant?: MediaVariant; className?: string }) {
  return <div className={`${styles.media} ${styles[variant]} ${className}`.trim()} data-media-container={variant}>{children}</div>;
}
