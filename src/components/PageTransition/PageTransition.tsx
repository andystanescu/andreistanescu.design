"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState, type MouseEvent } from "react";
import styles from "./PageTransition.module.css";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [exiting, setExiting] = useState(false);
  const [tabExit, setTabExit] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setExiting(false);
      setTabExit(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (exiting || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const target = event.target as HTMLElement;
    const link = target.closest("a");
    if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

    const href = link.getAttribute("href");
    if (!href || href.startsWith("#")) return;

    const destination = new URL(href, window.location.href);
    if (destination.origin !== window.location.origin) return;
    if (destination.pathname === window.location.pathname && destination.search === window.location.search) return;

    const destinationUrl = `${destination.pathname}${destination.search}${destination.hash}`;

    // Next 16 preserves the current scroll position when the incoming page is
    // already visible in the viewport. Fresh page navigation on this site is
    // explicit instead: the shared ScrollToTop controller owns the reset,
    // while fragment links continue to target their requested section.
    if (!destination.hash) {
      try {
        sessionStorage.setItem("conScept-force-top", "1");
      } catch {
        // Storage can be unavailable in private browsing.
      }
    }

    // Reduced motion skips the transition delay while retaining the same
    // deterministic scroll behavior as the animated path.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      event.preventDefault();
      event.stopPropagation();
      router.push(destinationUrl, { scroll: Boolean(destination.hash) });
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setTabExit(Boolean(link.closest('[role="tab"]')) && !link.closest('[data-admin-sidebar]'));
    setExiting(true);
    window.setTimeout(() => router.push(destinationUrl, { scroll: Boolean(destination.hash) }), 500);
  }

  return <div className={`${styles.page} ${exiting ? styles.pageExit : ""} ${tabExit ? styles.pageTabExit : ""}`} onClickCapture={handleClick}>{children}</div>;
}
