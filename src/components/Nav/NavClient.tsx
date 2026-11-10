"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo/Logo";
import { LogoIcon } from "@/components/Logo/LogoIcon";
import { Button } from "@/components/Button/Button";
import { ArrowIcon } from "@/components/Icon/ArrowIcon";
import { ThemeSwitch } from "@/components/ThemeSwitch/ThemeSwitch";
import { NavigationIcon } from "@/components/Nav/NavigationIcon";
import type { NavLink } from "@/lib/pages";
import styles from "./Nav.module.css";

type NavClientProps = {
  links: NavLink[];
  logoIdentity: "business" | "personal";
  logoImage: string;
  logoIconImage: string;
  navigationStyle: "default" | "masthead" | "islands" | "menu-first" | "floating-rail";
};

export function NavClient({ links, logoIdentity, logoImage, logoIconImage, navigationStyle }: NavClientProps) {
  const pathname = usePathname();
  const isContactPage = pathname === "/contact";
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
    let direction = 0;
    let directionStartY = window.scrollY;
    const update = () => {
      frame = 0;
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;
      setScrolled(currentY > 8);

      if (!isReadingPage || window.innerWidth > 900 || currentY < 160) {
        setReadingNavHidden(false);
        direction = 0;
        directionStartY = currentY;
      } else if (delta !== 0) {
        const nextDirection = Math.sign(delta);
        if (nextDirection !== direction) {
          direction = nextDirection;
          directionStartY = lastScrollY.current;
        }
        if (Math.abs(currentY - directionStartY) > 10) {
          setReadingNavHidden(direction > 0);
        }
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
        const controls = Array.from(overlayRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((control) => control.getClientRects().length > 0);
        if (!controls.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    function handleResize() {
      if (navigationStyle === "default" && window.innerWidth > 900) setMenuOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
      (previousFocus?.isConnected ? previousFocus : menuToggleRef.current)?.focus();
    };
  }, [menuOpen, navigationStyle]);

  useEffect(() => {
    return () => document.body.classList.remove("no-scroll");
  }, []);

  const closeMenu = () => setMenuOpen(false);

  // Exactly one Active per navigation — a nested route (e.g. /work/[slug])
  // still highlights its top-level section.
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  if (navigationStyle === "floating-rail") {
    return <header data-navigation-style="floating-rail" className={`${styles.floatingRail} ${readingNavHidden ? styles.floatingRailHidden : ""}`}>
      <Link className={styles.railBrand} href="/" aria-label={`${logoIdentity === "personal" ? "Andrei Stanescu" : "ConScept"} home`}><LogoIcon identity={logoIdentity} imageUrl={logoIconImage} /></Link>
      <nav className={styles.railLinks} aria-label="Primary">{links.map((link) => <Link key={link.href} href={link.href} aria-label={link.label} aria-current={isActive(link.href) ? "page" : undefined}><NavigationIcon page={link.href} custom /><span>{link.label}</span></Link>)}</nav>
      <div className={styles.railTheme}><span className={styles.railDesktopTheme}><ThemeSwitch /></span><span className={styles.railMobileTheme}><ThemeSwitch compact /></span></div>
    </header>;
  }

  if (navigationStyle === "menu-first") {
    return <header data-navigation-style="menu-first" className={`${styles.menuFirst} ${readingNavHidden && !menuOpen ? styles.menuFirstHidden : ""}`}>
      <div ref={overlayRef} role={menuOpen ? "dialog" : undefined} aria-modal={menuOpen ? true : undefined} aria-label={menuOpen ? "Navigation menu" : undefined} className={styles.menuFirstLayout}>
        <div className={styles.menuFirstBar}>
          <Link href="/" onClick={closeMenu} aria-label={`${logoIdentity === "personal" ? "Andrei Stanescu" : "ConScept"} home`}><Logo variant="compact" identity={logoIdentity} imageUrl={logoImage} /></Link>
          <div className={styles.menuFirstControls}>
            <div className={styles.menuFirstDesktopTheme}><ThemeSwitch horizontal /></div>
            <button ref={menuToggleRef} className={styles.menuFirstToggle} type="button" aria-expanded={menuOpen} aria-controls="menu-first-panel" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? "Close" : "Menu"}<span aria-hidden="true">{menuOpen ? "×" : "☰"}</span></button>
            {!isContactPage && <div className={styles.menuFirstDesktopAction}><Button href="/contact" onClick={closeMenu} icon={<ArrowIcon size={16} />}>Let&apos;s talk</Button></div>}
          </div>
        </div>
        <div id="menu-first-panel" className={`${styles.menuFirstPanel} ${menuOpen ? styles.menuFirstPanelOpen : ""}`} aria-hidden={!menuOpen} inert={!menuOpen}>
          <nav className={styles.menuFirstLinks} aria-label="Primary">{links.map((link, index) => <Link key={link.href} href={link.href} onClick={closeMenu} aria-current={isActive(link.href) ? "page" : undefined}><span>{String(index + 1).padStart(2, "0")}</span><strong>{link.label}</strong></Link>)}</nav>
          <div className={styles.menuFirstMobileActions}>{!isContactPage && <Button href="/contact" onClick={closeMenu} icon={<ArrowIcon size={16} />}>Let&apos;s talk</Button>}<ThemeSwitch horizontal /></div>
        </div>
      </div>
    </header>;
  }

  if (navigationStyle === "islands") {
    return <header data-navigation-style="islands" className={styles.islands}>
      <div className={styles.islandsInner}>
        <Link className={styles.islandsBrand} href="/" aria-label={`${logoIdentity === "personal" ? "Andrei Stanescu" : "ConScept"} home`}><Logo variant="compact" identity={logoIdentity} imageUrl={logoImage} /></Link>
        <div className={`${styles.islandsDock} ${readingNavHidden ? styles.islandsDockHidden : ""}`}>
          <nav className={styles.islandsLinks} aria-label="Primary">{links.map((link) => <Link key={link.href} href={link.href} aria-label={link.label} aria-current={isActive(link.href) ? "page" : undefined} className={isActive(link.href) ? styles.islandsActive : undefined}><span className={styles.islandsIcon}><NavigationIcon page={link.href} custom /></span><span className={styles.islandsLabel}>{link.label}</span></Link>)}</nav>
          {!isContactPage && <div className={styles.islandsMobileAction}><Button href="/contact">Let&apos;s talk</Button></div>}
        </div>
        <div className={styles.islandsActions}>{!isContactPage && <Button href="/contact" icon={<ArrowIcon size={16} />}>Let&apos;s talk</Button>}<ThemeSwitch horizontal /></div>
      </div>
    </header>;
  }

  if (navigationStyle === "masthead") {
    return <header data-navigation-style="masthead" data-masthead-collapsed={scrolled || undefined} className={`${styles.masthead} ${readingNavHidden ? styles.mastheadReadingHidden : ""}`}>
      <div className={styles.mastheadBrandRow}>
        <div className={styles.mastheadTheme}><ThemeSwitch horizontal /></div>
        <Link className={styles.mastheadLogo} href="/" aria-label={`${logoIdentity === "personal" ? "Andrei Stanescu" : "ConScept"} home`}><Logo variant="compact" identity={logoIdentity} imageUrl={logoImage} /></Link>
        <div className={styles.mastheadAction}>{!isContactPage && <Button href="/contact" icon={<ArrowIcon size={16} />}>Let&apos;s talk</Button>}</div>
      </div>
      <nav className={styles.mastheadLinks} aria-label="Primary">{links.map((link) => <Link key={link.href} href={link.href} aria-current={isActive(link.href) ? "page" : undefined} className={isActive(link.href) ? styles.mastheadActive : undefined}>{link.label}</Link>)}</nav>
    </header>;
  }

  const overlay = (
    <div
      ref={overlayRef}
      id="mobile-menu"
      className={`${styles.overlay} ${menuOpen ? styles.overlayOpen : ""}`}
      role="dialog"
      aria-modal={menuOpen ? true : undefined}
      aria-hidden={!menuOpen}
      inert={!menuOpen}
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
      {!isContactPage && (
        <Button href="/contact" onClick={closeMenu} icon={<ArrowIcon size={16} />}>
          Let&apos;s talk
        </Button>
      )}
    </div>
  );

  return (
    <>
      <header
        className={`${styles.navOuter} ${scrolled ? styles.scrolled : ""} ${readingNavHidden && !menuOpen ? styles.readingNavHidden : ""}`}
      >
        <div className={`container ${styles.nav} ${logoIdentity === "personal" ? styles.personal : ""}`}>
          <Link href="/" aria-label={`${logoIdentity === "personal" ? "Andrei Stanescu" : "ConScept"} home`} onClick={closeMenu}>
            <Logo variant="compact" identity={logoIdentity} imageUrl={logoImage} />
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
              {!isContactPage && (
                <div className={styles.desktopCta}>
                  <Button href="/contact" icon={<ArrowIcon size={16} />}>
                    Let&apos;s talk
                  </Button>
                </div>
              )}
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
