import type { ReactNode } from "react";
import styles from "./Button.module.css";

type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "tertiary" | "ghost" | "link";
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  size?: "default" | "compact";
  /** Only applies when there's no href (i.e. it renders as <button>). */
  type?: "button" | "submit";
  download?: boolean;
};

/**
 * Primary rests neutral and turns accent-orange on hover/focus — orange marks
 * foundations, so on a control it signals interaction rather than identity.
 * There is deliberately no disabled state: a control that can't be used
 * should be hidden, or explain on activation what's unmet.
 */
export function Button({
  children,
  variant = "primary",
  icon,
  href,
  onClick,
  size = "default",
  type = "button",
  download,
}: ButtonProps) {
  const className = `${styles.button} ${styles[variant]} ${
    size === "compact" ? styles.compact : ""
  }`;

  const content = (
    <>
      <span className="label-button">{children}</span>
      {icon}
    </>
  );

  if (href) {
    return (
      <a className={className} href={href} onClick={onClick} download={download || undefined}>
        {content}
      </a>
    );
  }

  return (
    <button type={type} className={className} onClick={onClick}>
      {content}
    </button>
  );
}
