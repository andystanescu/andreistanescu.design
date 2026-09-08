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
      <span className={!dark ? styles.activeLabel : undefined}>Light</span>
      <span className={styles.track} aria-hidden="true">
        <span className={`${styles.thumb} ${dark ? styles.thumbDark : ""}`} />
      </span>
      <span className={dark ? styles.activeLabel : undefined}>Dark</span>
    </button>
  );
}
