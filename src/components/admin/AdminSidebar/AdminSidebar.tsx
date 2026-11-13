"use client";

import { useEffect, useRef, useState } from "react";
import { AdminIcon } from "@/components/admin/AdminIcon/AdminIcon";
import { Logo } from "@/components/Logo/Logo";
import { LogoIcon } from "@/components/Logo/LogoIcon";
import { AdminNav } from "@/components/admin/AdminNav/AdminNav";
import { ViewSiteLink } from "@/components/admin/ViewSiteLink/ViewSiteLink";
import styles from "@/app/admin/(dashboard)/dashboard.module.css";

export function AdminSidebar({ logoIdentity, logoImage, logoIconImage }: { logoIdentity: "business" | "personal"; logoImage: string; logoIconImage: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const restoreFocusOnCloseRef = useRef(true);
  const drawerWasOpenRef = useRef(false);

  function closeDrawer(restoreFocus = true) {
    restoreFocusOnCloseRef.current = restoreFocus;
    setMobileOpen(false);
  }

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const handleViewportChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        restoreFocusOnCloseRef.current = false;
        setMobileOpen(false);
      }
    };
    desktop.addEventListener("change", handleViewportChange);
    return () => desktop.removeEventListener("change", handleViewportChange);
  }, []);

  useEffect(() => {
    if (!mobileOpen) {
      if (drawerWasOpenRef.current && restoreFocusOnCloseRef.current) openerRef.current?.focus();
      drawerWasOpenRef.current = false;
      return;
    }
    drawerWasOpenRef.current = true;

    const page = document.querySelector<HTMLElement>("[data-page-transition-content]");
    const wasInert = page?.inert ?? false;
    if (page) page.inert = true;

    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDrawer();
        return;
      }

      if (event.key !== "Tab") return;
      const drawer = drawerRef.current;
      if (!drawer) return;
      const focusable = Array.from(
        drawer.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      ).filter((element) => element.getClientRects().length > 0 && element.getAttribute("aria-hidden") !== "true");
      if (focusable.length === 0) {
        event.preventDefault();
        drawer.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !drawer.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !drawer.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      if (page) page.inert = wasInert;
    };
  }, [mobileOpen]);

  function toggleSidebar() {
    setCollapsed((current) => !current);
  }

  return (
    <>
      <button
        type="button"
        className={styles.mobileNavToggle}
        ref={openerRef}
        onClick={() => {
          restoreFocusOnCloseRef.current = true;
          setMobileOpen(true);
        }}
        aria-label="Open admin navigation"
        aria-expanded={mobileOpen}
        aria-controls="admin-navigation-drawer"
      >
        <AdminIcon name="action-menu" />
        <span>Menu</span>
      </button>
      {mobileOpen && <button type="button" className={styles.mobileNavBackdrop} aria-label="Close admin navigation" onClick={() => closeDrawer()} />}
      <aside
        id="admin-navigation-drawer"
        ref={drawerRef}
        role={mobileOpen ? "dialog" : undefined}
        aria-modal={mobileOpen || undefined}
        aria-label={mobileOpen ? "Admin navigation" : undefined}
        tabIndex={mobileOpen ? -1 : undefined}
        className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""} ${mobileOpen ? styles.sidebarMobileOpen : ""}`}
        data-admin-sidebar
        data-collapsed={collapsed || undefined}
      >
      <div className={styles.sidebarTop}>
        <div className={styles.brand}>
          <div className={styles.brandLogo}>{collapsed && !mobileOpen ? logoIconImage ? <LogoIcon identity={logoIdentity} imageUrl={logoIconImage} /> : <span aria-label="Admin">A</span> : <Logo variant="compact" identity={logoIdentity} imageUrl={logoImage} />}</div>
          <p className={`${styles.brandLabel} label-eyebrow`} style={{ color: "var(--text-accent)" }}>
            admin
          </p>
        </div>
        <button
          type="button"
          className={styles.sidebarToggle}
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand admin navigation" : "Collapse admin navigation"}
          title={collapsed ? "Expand navigation" : undefined}
          aria-expanded={!collapsed}
        >
          <AdminIcon name={collapsed ? "direction-chevron-right" : "direction-chevron-left"} />
          <span>{collapsed ? "Expand navigation" : "Collapse navigation"}</span>
        </button>
        <button ref={closeButtonRef} type="button" className={styles.mobileNavClose} onClick={() => closeDrawer()} aria-label="Close admin navigation"><AdminIcon name="action-close" /></button>
      </div>
      <ViewSiteLink />
      <div className={styles.navWrap} onClick={(event) => { if ((event.target as HTMLElement).closest("a")) closeDrawer(false); }}>
        <AdminNav collapsed={collapsed && !mobileOpen} />
      </div>
      <form action="/api/admin/logout" method="POST">
        <button type="submit" className={styles.logout} aria-label="Sign out" title={collapsed && !mobileOpen ? "Sign out" : undefined}>
          <AdminIcon name="admin-sign-out" />
          <span>Sign out</span>
        </button>
      </form>
      </aside>
    </>
  );
}
