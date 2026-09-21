"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

export function ScrollToTop() {
  const pathname = usePathname();
  const initialPageRef = useRef(true);
  const historyTraversalPathRef = useRef<string | null>(null);

  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "auto";
    const markHistoryTraversal = () => { historyTraversalPathRef.current = window.location.pathname; };
    window.addEventListener("popstate", markHistoryTraversal);
    return () => {
      window.removeEventListener("popstate", markHistoryTraversal);
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  useLayoutEffect(() => {
    // On the first render, leave scrolling to the browser. That preserves a
    // refresh position, restores a history entry, opens a direct hash at its
    // target, and leaves an ordinary direct URL at the top.
    if (initialPageRef.current) {
      initialPageRef.current = false;
      return;
    }

    // Back and Forward own their saved positions. A popstate precedes the
    // pathname update, so skip the route-change reset for that render.
    if (historyTraversalPathRef.current === pathname) {
      historyTraversalPathRef.current = null;
      return;
    }

    historyTraversalPathRef.current = null;

    // A deliberate link to a fragment is an explicit user request to move
    // to that section, including when the fragment belongs to another page.
    if (window.location.hash) return;

    // A new in-app destination starts at the beginning. Nested page regions
    // are reset alongside the document for admin and editor layouts.
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.querySelectorAll<HTMLElement>("[data-scroll-region]").forEach((container) => {
      container.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }, [pathname]);

  useEffect(() => {
    if (window.location.pathname.startsWith("/admin")) return;
    const savePublicLocation = () => {
      try {
        localStorage.setItem(
          "conScept-last-public-location",
          `${window.location.pathname}${window.location.search}`
        );
      } catch {
        // Storage can be unavailable in private browsing.
      }
    };
    savePublicLocation();
    window.addEventListener("scroll", savePublicLocation, { passive: true });
    return () => window.removeEventListener("scroll", savePublicLocation);
  }, [pathname]);

  return null;
}
