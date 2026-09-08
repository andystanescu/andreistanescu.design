"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo/Logo";
import { Button } from "@/components/Button/Button";
import { ArrowIcon } from "@/components/Icon/ArrowIcon";
import type { NavLink } from "@/lib/pages";
import styles from "./Nav.module.css";

type NavClientProps = {
  links: NavLink[];
  logoIdentity: "business" | "personal";
};

export function NavClient({ links, logoIdentity }: NavClientProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Full-page overlay: lock background scroll, close on Escape, and close
  // automatically if the viewport grows past the breakpoint it belongs to.
  useEffect(() => {
    document.body.classList.toggle("no-scroll", menuOpen);
    if (!menuOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    function handleResize() {
      if (window.innerWidth > 900) setMenuOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
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
        className={`${styles.navOuter} ${scrolled ? styles.scrolled : ""}`}
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
            <div className={styles.desktopCta}>
              <Button href="/contact" icon={<ArrowIcon size={16} />}>
                Let&apos;s talk
              </Button>
            </div>
            <button
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
