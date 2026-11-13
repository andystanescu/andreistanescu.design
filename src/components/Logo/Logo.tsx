import { ThemedLogoImage } from "./ThemedLogoImage";
import styles from "./Logo.module.css";
import { PersonalLogoMark } from "./PersonalLogoMark";

type LogoProps = {
  /** compact = nav/header strips under 48px tall. primary = everywhere else (min width 160px). */
  variant?: "compact" | "primary";
  /** inverted = sitting on a dark section background. */
  theme?: "default" | "inverted";
  identity?: "business" | "personal";
  imageUrl?: string;
};

const SIZES = {
  // Matches the Figma compact lockup: 28px mark, 22px wordmark.
  compact: { icon: 28, text: 22 },
  primary: { icon: 44, text: 36 },
};

export function Logo({ variant = "compact", theme = "default", identity = "business", imageUrl = "" }: LogoProps) {
  const { icon, text } = SIZES[variant];
  const canSwapNavIcon = variant === "compact" && theme === "default" && identity === "business";

  if (imageUrl) {
    return <span className={`${styles.logo} ${variant === "primary" ? styles.primary : ""}`}><ThemedLogoImage variant="full" forceDark={theme === "inverted"} className={styles.logoImage} src={imageUrl} alt="Site logo" width={variant === "primary" ? 260 : 180} height={variant === "primary" ? 48 : 32} /></span>;
  }

  if (identity === "personal") {
    return (
      <span className={`${styles.logo} ${styles.personal}`}>
        <PersonalLogoMark size={icon} />
        <span className={styles.wordmark} style={{ fontSize: text, letterSpacing: -text * 0.02 }}>AndreiStanescu</span>
      </span>
    );
  }

  const iconSrc = theme === "inverted"
      ? "/assets/logo-icon-footer.svg"
      : "/assets/logo-icon-nav.svg";
  return (
    <span className={styles.logo}>
      {canSwapNavIcon ? (
        <span className={styles.iconSwap} style={{ width: icon, height: icon }}>
          <img
            className={styles.icon}
            src={iconSrc}
            alt=""
            width={icon}
            height={icon}
          />
          <img
            className={`${styles.icon} ${styles.iconHover}`}
            src="/assets/logo-icon-nav-hover.svg"
            alt=""
            width={icon}
            height={icon}
          />
        </span>
      ) : (
        <img
          src={iconSrc}
          alt=""
          width={icon}
          height={icon}
          style={{ width: icon, height: icon }}
        />
      )}
      <span
        className={styles.wordmark}
        style={{ fontSize: text, letterSpacing: -text * 0.02 }}
      >
            ConScept
      </span>
    </span>
  );
}
