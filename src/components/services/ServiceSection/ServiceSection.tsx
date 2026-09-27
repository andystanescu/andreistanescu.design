import type { ReactNode } from "react";
import styles from "./ServiceSection.module.css";

export type ServiceSectionWidth = "contained" | "wide" | "full";

type ServiceSectionProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  labelledBy?: string;
  width?: ServiceSectionWidth;
};

/** Shared outer shell for service detail sections. */
export function ServiceSection({
  children,
  className = "",
  id,
  labelledBy,
  width = "contained",
}: ServiceSectionProps) {
  const widthClass = width === "contained" ? "container" : styles[width];

  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`${widthClass} ${styles.section} ${className}`.trim()}
    >
      {children}
    </section>
  );
}

type ServiceSectionHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
  eyebrowClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  titleId?: string;
};

/** Consistent eyebrow → heading → optional introduction structure. */
export function ServiceSectionHeader({
  eyebrow,
  title,
  description,
  className = "",
  eyebrowClassName = "",
  titleClassName = "heading-02",
  descriptionClassName = "",
  titleId,
}: ServiceSectionHeaderProps) {
  return (
    <header className={`${styles.header} ${className}`.trim()}>
      <p className={`label-eyebrow ${styles.eyebrow} ${eyebrowClassName}`.trim()}>{eyebrow}</p>
      <h2 id={titleId} className={titleClassName}>{title}</h2>
      {description && <p className={`${styles.description} ${descriptionClassName}`.trim()}>{description}</p>}
    </header>
  );
}
