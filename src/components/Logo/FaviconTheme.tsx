"use client";

import { useEffect } from "react";

export function FaviconTheme() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => {
      const selected = document.documentElement.dataset.theme;
      const mode = selected === "dark" || (!selected && media.matches) ? "dark" : "light";
      document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]').forEach((link) => {
        const url = new URL(link.href, location.href);
        if (url.pathname !== "/api/site-icon" || url.searchParams.get("mode") === mode) return;
        url.searchParams.set("mode", mode);
        link.href = `${url.pathname}${url.search}`;
      });
    };
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {attributes: true, attributeFilter: ["data-theme"]});
    observer.observe(document.head, {childList: true, subtree: true});
    media.addEventListener("change", update);
    update();
    return () => { observer.disconnect(); media.removeEventListener("change", update); };
  }, []);
  return null;
}
