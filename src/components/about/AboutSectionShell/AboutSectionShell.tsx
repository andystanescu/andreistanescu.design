import type { ReactNode } from "react";
import { AccentText } from "@/components/AccentText/AccentText";
import styles from "./AboutSectionShell.module.css";

type SectionWidth = "constrained" | "wide" | "full";
type SectionVariant = "default" | "separated" | "surface";

type AboutSectionShellProps = {
  id: string;
  eyebrow?: string;
  heading: string;
  intro?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  headingClassName?: string;
  introClassName?: string;
  headerWidth?: SectionWidth;
  contentWidth?: SectionWidth;
  variant?: SectionVariant;
};

export function AboutSectionShell({
  id,
  eyebrow,
  heading,
  intro,
  action,
  children,
  className = "",
  headingClassName = "display-small",
  introClassName = "body-default",
  headerWidth = "constrained",
  contentWidth = "wide",
  variant = "default",
}: AboutSectionShellProps) {
  const widthClass = {
    constrained: styles.constrained,
    wide: styles.wide,
    full: styles.full,
  };
  const variantClass = {
    default: styles.default,
    separated: styles.separated,
    surface: styles.surface,
  };

  return (
    <section id={id} className={`${styles.section} ${variantClass[variant]} ${className}`.trim()}>
      <div className={`container ${styles.inner}`}>
        <header className={`${styles.header} ${widthClass[headerWidth]}`}>
          {eyebrow && (
            <p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>
              {eyebrow}
            </p>
          )}
          <h2 className={`${headingClassName} ${styles.heading}`}>
            <AccentText text={heading} />
          </h2>
          {intro && (
            <p className={`${introClassName} ${styles.intro}`}>
              {intro}
            </p>
          )}
          {action && <div className={styles.action}>{action}</div>}
        </header>
        <div className={`${styles.content} ${widthClass[contentWidth]}`}>{children}</div>
      </div>
    </section>
  );
}
