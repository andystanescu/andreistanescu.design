import type { ReactNode } from "react";
import { AccentText } from "@/components/AccentText/AccentText";
import styles from "./HomepageSectionHeader.module.css";

type HomepageSectionHeaderProps = {
  eyebrow?: string;
  title: string;
  intro?: string;
  action?: ReactNode;
  className?: string;
};

export function HomepageSectionHeader({
  eyebrow,
  title,
  intro,
  action,
  className,
}: HomepageSectionHeaderProps) {
  return (
    <header className={`${styles.header}${className ? ` ${className}` : ""}`}>
      {eyebrow && (
        <p className={`label-eyebrow ${styles.eyebrow}`}>{eyebrow}</p>
      )}
      <h2 className={`display-small ${styles.title}`}>
        <AccentText text={title} />
      </h2>
      {intro && <p className={`body-small ${styles.intro}`}>{intro}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </header>
  );
}
