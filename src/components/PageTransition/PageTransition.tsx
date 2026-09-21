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

    // Let Next's link handling navigate immediately when the user has asked
    // for reduced motion. The animated path below deliberately delays the
    // route change until its exit transition has finished.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    event.preventDefault();
    event.stopPropagation();
    setTabExit(Boolean(link.closest('[role="tab"]')) && !link.closest('[data-admin-sidebar]'));
    setExiting(true);
    window.setTimeout(() => router.push(`${destination.pathname}${destination.search}${destination.hash}`, { scroll: true }), 500);
  }

  return <div className={`${styles.page} ${exiting ? styles.pageExit : ""} ${tabExit ? styles.pageTabExit : ""}`} onClickCapture={handleClick}>{children}</div>;
}
