import { getSettings } from "@/lib/settings";
import { PersonalLogoMark } from "@/components/Logo/PersonalLogoMark";
import styles from "./AuthorAvatar.module.css";

export function AuthorAvatar({ author }: { author: string }) {
  const settings = getSettings();
  const avatar = settings.about_hero_image;
  return (
    <span className={styles.author}>
      {avatar ? (
        <img src={avatar} alt="" aria-hidden="true" />
      ) : settings.logo_identity === "personal" ? (
        <PersonalLogoMark className={styles.logoMark} size={24} />
      ) : (
        <img src="/assets/logo-icon-nav.svg" alt="" aria-hidden="true" />
      )}
      <span>{author}</span>
    </span>
  );
}
