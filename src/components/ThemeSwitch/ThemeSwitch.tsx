"use client";

import { useSyncExternalStore } from "react";
import styles from "./ThemeSwitch.module.css";

const STORAGE_KEY = "conscept-theme";
const THEME_EVENT = "conscept-theme-change";

function isDarkTheme() {
  if (typeof document === "undefined") return false;
  const explicitTheme = document.documentElement.dataset.theme;
  return explicitTheme === "dark" ||
    (!explicitTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

function subscribe(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(THEME_EVENT, onStoreChange);
  media.addEventListener("change", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(THEME_EVENT, onStoreChange);
    media.removeEventListener("change", onStoreChange);
  };
}

export function ThemeSwitch() {
  const dark = useSyncExternalStore(subscribe, isDarkTheme, () => false);

  const toggleTheme = () => {
    const nextTheme = dark ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    localStorage.setItem(STORAGE_KEY, nextTheme);
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  return (
    <button
      type="button"
      className={styles.switch}
      role="switch"
      aria-checked={dark}
      aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
      onClick={toggleTheme}
    >
      <svg
        className={!dark ? styles.activeIcon : undefined}
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className={styles.track} aria-hidden="true">
        <span className={`${styles.thumb} ${dark ? styles.thumbDark : ""}`} />
      </span>
      <svg
        className={dark ? styles.activeIcon : undefined}
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path d="M20.25 15.31A8.5 8.5 0 0 1 8.69 3.75a8.5 8.5 0 1 0 11.56 11.56Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
