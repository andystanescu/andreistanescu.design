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
    let forceTop = false;
    try {
      forceTop = sessionStorage.getItem("conScept-force-top") === "1";
    } catch {
      // Storage can be unavailable in private browsing.
    }

    // On the first render, leave scrolling to the browser. That preserves a
    // refresh position, restores a history entry, opens a direct hash at its
    // target, and leaves an ordinary direct URL at the top. A client-side
    // route can remount this controller, so an explicit fresh-navigation
    // marker must still reset even though this is the component's first pass.
    if (initialPageRef.current) {
      initialPageRef.current = false;
      if (!forceTop) return;
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

    try {
      sessionStorage.removeItem("conScept-force-top");
    } catch {
      // Storage can be unavailable in private browsing.
    }

    const root = document.documentElement;
    const previousScrollBehavior = root.style.getPropertyValue("scroll-behavior");
    const previousScrollPriority = root.style.getPropertyPriority("scroll-behavior");
    const restoreScrollBehavior = () => {
      if (previousScrollBehavior) {
        root.style.setProperty("scroll-behavior", previousScrollBehavior, previousScrollPriority);
      } else {
        root.style.removeProperty("scroll-behavior");
      }
    };

    // Next 16 no longer suppresses the document's CSS smooth scrolling
    // during navigation. Keep the override active through the first complete
    // paint so it also cancels any smooth reset Next started before this
    // layout effect ran.
    root.style.setProperty("scroll-behavior", "auto", "important");

    const resetScroll = () => {
      window.scrollTo({ top: 0, left: 0 });
      document.querySelectorAll<HTMLElement>("[data-scroll-region]").forEach((container) => {
        container.scrollTop = 0;
        container.scrollLeft = 0;
      });
    };

    // Reset synchronously and through the first completed paint. Dynamic
    // server routes can finish their own scroll handling after this layout
    // effect and after the first animation frame; the second frame is the
    // first reliable point at which the incoming page owns the viewport.
    resetScroll();
    let paintedFrame = 0;
    const layoutFrame = window.requestAnimationFrame(() => {
      resetScroll();
      paintedFrame = window.requestAnimationFrame(() => {
        resetScroll();
        restoreScrollBehavior();
      });
    });
    return () => {
      window.cancelAnimationFrame(layoutFrame);
      if (paintedFrame) window.cancelAnimationFrame(paintedFrame);
      restoreScrollBehavior();
    };
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
