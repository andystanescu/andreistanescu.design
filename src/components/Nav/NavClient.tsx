"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo/Logo";
import { Button } from "@/components/Button/Button";
import { ArrowIcon } from "@/components/Icon/ArrowIcon";
import { ThemeSwitch } from "@/components/ThemeSwitch/ThemeSwitch";
import type { NavLink } from "@/lib/pages";
import styles from "./Nav.module.css";

type NavClientProps = {
  links: NavLink[];
  logoIdentity: "business" | "personal";
};

export function NavClient({ links, logoIdentity }: NavClientProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [readingNavHidden, setReadingNavHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastScrollY = useRef(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  // The portal target (document.body) only exists on the client — this is
  // React's recommended way to render something only after hydration
  // without the "setState in an effect" anti-pattern (and without a
  // server/client markup mismatch).
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    const isReadingPage = /^\/(work|insights)\/[^/]+\/?$/.test(pathname);
    let frame = 0;
    const update = () => {
      frame = 0;
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;
      setScrolled(currentY > 8);

      if (!isReadingPage || window.innerWidth > 900 || currentY < 160) {
        setReadingNavHidden(false);
      } else if (delta > 10) {
        setReadingNavHidden(true);
      } else if (delta < -10) {
        setReadingNavHidden(false);
      }

      lastScrollY.current = currentY;
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const onResize = () => {
      if (window.innerWidth > 900) setReadingNavHidden(false);
      onScroll();
    };
    lastScrollY.current = window.scrollY;
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  // Full-page overlay: lock background scroll, close on Escape, and close
  // automatically if the viewport grows past the breakpoint it belongs to.
  useEffect(() => {
    document.body.classList.toggle("no-scroll", menuOpen);
    if (!menuOpen) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    window.requestAnimationFrame(() => overlayRef.current?.querySelector<HTMLElement>("a, button")?.focus());

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
      if (e.key === "Tab" && overlayRef.current) {
        const controls = Array.from(overlayRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'));
        if (!controls.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    function handleResize() {
      if (window.innerWidth > 900) setMenuOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
      (previousFocus?.isConnected ? previousFocus : menuToggleRef.current)?.focus();
    };
  }, [menuOpen]);

  useEffect(() => {
    return () => document.body.classList.remove("no-scroll");
  }, []);

  const closeMenu = () => setMenuOpen(false);

  // Exactly one Active per navigation — a nested route (e.g. /work/[slug])
  // still highlights its top-level section.
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const overlay = (
    <div
      ref={overlayRef}
      id="mobile-menu"
      className={`${styles.overlay} ${menuOpen ? styles.overlayOpen : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
    >
      <nav className={styles.overlayLinks} aria-label="Primary">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={closeMenu}
            aria-current={isActive(link.href) ? "page" : undefined}
            className={isActive(link.href) ? styles.overlayLinkActive : undefined}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <Button href="/contact" onClick={closeMenu} icon={<ArrowIcon size={16} />}>
        Let&apos;s talk
      </Button>
    </div>
  );

  return (
    <>
      <header
        className={`${styles.navOuter} ${scrolled ? styles.scrolled : ""} ${readingNavHidden && !menuOpen ? styles.readingNavHidden : ""}`}
      >
        <div className={`container ${styles.nav} ${logoIdentity === "personal" ? styles.personal : ""}`}>
          <Link href="/" aria-label="ConScept home" onClick={closeMenu}>
            <Logo variant="compact" identity={logoIdentity} />
          </Link>
          <div className={styles.right}>
            <nav className={styles.links} aria-label="Primary">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={isActive(link.href) ? styles.linkActive : undefined}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className={styles.controls}>
              <div className={styles.desktopCta}>
                <Button href="/contact" icon={<ArrowIcon size={16} />}>
                  Let&apos;s talk
                </Button>
              </div>
              <ThemeSwitch />
              <button
                ref={menuToggleRef}
                type="button"
                className={styles.menuToggle}
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <span
                  className={`${styles.bar} ${menuOpen ? styles.barTop : ""}`}
                />
                <span
                  className={`${styles.bar} ${menuOpen ? styles.barMiddle : ""}`}
                />
                <span
                  className={`${styles.bar} ${menuOpen ? styles.barBottom : ""}`}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Portaled straight to <body> — not nested under the nav — so it can
          never be trapped by an ancestor's containing-block-creating CSS
          (e.g. .navOuter.scrolled's backdrop-filter, which otherwise turns
          the nav into the containing block for this overlay's position:fixed
          and collapses it into the nav's own 97px strip). This guarantees it
          renders on top of everything, from wherever it's opened. */}
      {mounted && createPortal(overlay, document.body)}
    </>
  );
}
