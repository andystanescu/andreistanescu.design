import { getSettings } from "@/lib/settings";
import styles from "./AuthorAvatar.module.css";

export function AuthorAvatar({ author }: { author: string }) {
  const settings = getSettings();
  const fallback = settings.logo_identity === "personal" ? "/assets/logo-icon-personal.svg" : "/assets/logo-icon-nav.svg";
  return <span className={styles.author}><img src={settings.about_hero_image || fallback} alt="" aria-hidden="true" /><span>{author}</span></span>;
}
