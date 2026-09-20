"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";

export function ScrollToTop() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (window.location.hash) return;

    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        document.querySelectorAll<HTMLElement>("[data-scroll-region]").forEach((container) => {
          container.scrollTo({ top: 0, left: 0, behavior: "auto" });
        });
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, [pathname]);

  useEffect(() => {
    const key = `scroll-position:${window.location.pathname}${window.location.search}`;
    const storageKey = "conScept-scroll-positions";
    const isPublicPage = !window.location.pathname.startsWith("/admin");
    const regions = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll-region]"));

    // Reset immediately as well as after the new page has painted. The later
    // reset wins if Next.js restores the previous viewport during navigation.
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
