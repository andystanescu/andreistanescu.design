"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    const key = `scroll-position:${window.location.pathname}${window.location.search}`;
    const storageKey = "conScept-scroll-positions";
    const isPublicPage = !window.location.pathname.startsWith("/admin");
    const regions = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll-region]"));

    // Every new route starts at the top. Hash links remain responsible for
    // positioning the user within the current page.
    if (!window.location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      regions.forEach((container) => container.scrollTo({ top: 0, left: 0, behavior: "auto" }));
    }

    const save = () => {
      try {
        const saved = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
        const position = {
          window: window.scrollY,
          regions: regions.map((container) => container.scrollTop),
        };
        saved[key] = position;
        sessionStorage.setItem(storageKey, JSON.stringify(saved));
        if (isPublicPage) {
          localStorage.setItem(storageKey, JSON.stringify({
            ...JSON.parse(localStorage.getItem(storageKey) || "{}"),
            [key]: position,
          }));
          localStorage.setItem(
            "conScept-last-public-location",
            `${window.location.pathname}${window.location.search}${window.location.hash}`
          );
        }
      } catch {
        // Storage can be unavailable in private browsing; scrolling still works.
      }
    };

    window.addEventListener("scroll", save, { passive: true });
    regions.forEach((container) => container.addEventListener("scroll", save, { passive: true }));
    if (isPublicPage) save();
    return () => {
      window.removeEventListener("scroll", save);
      regions.forEach((container) => container.removeEventListener("scroll", save));
    };
  }, [pathname]);

  return null;
}
