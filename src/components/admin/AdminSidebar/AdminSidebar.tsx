"use client";

import { useState } from "react";
import { Logo } from "@/components/Logo/Logo";
import { AdminNav } from "@/components/admin/AdminNav/AdminNav";
import { ViewSiteLink } from "@/components/admin/ViewSiteLink/ViewSiteLink";
import styles from "@/app/admin/(dashboard)/dashboard.module.css";

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleSidebar() {
    setCollapsed((current) => !current);
  }

  return (
    <>
      <button
        type="button"
        className={styles.mobileNavToggle}
        onClick={() => setMobileOpen(true)}
        aria-label="Open admin navigation"
        aria-expanded={mobileOpen}
        aria-controls="admin-navigation-drawer"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        <span>Menu</span>
      </button>
      {mobileOpen && <button type="button" className={styles.mobileNavBackdrop} aria-label="Close admin navigation" onClick={() => setMobileOpen(false)} />}
      <aside
        id="admin-navigation-drawer"
        className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""} ${mobileOpen ? styles.sidebarMobileOpen : ""}`}
        data-admin-sidebar
        data-collapsed={collapsed || undefined}
      >
      <div className={styles.sidebarTop}>
        <div className={styles.brand}>
          <div className={styles.brandLogo}><Logo variant="compact" /></div>
          <p className={`${styles.brandLabel} label-eyebrow`} style={{ color: "var(--text-accent)" }}>
            admin
          </p>
        </div>
        <button
          type="button"
          className={styles.sidebarToggle}
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand admin navigation" : "Collapse admin navigation"}
          aria-expanded={!collapsed}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={collapsed ? "m9 5 7 7-7 7" : "m15 5-7 7 7 7"} />
          </svg>
          <span>{collapsed ? "Expand navigation" : "Collapse navigation"}</span>
        </button>
        <button type="button" className={styles.mobileNavClose} onClick={() => setMobileOpen(false)} aria-label="Close admin navigation">×</button>
      </div>
      <ViewSiteLink />
      <div className={styles.navWrap} onClick={(event) => { if ((event.target as HTMLElement).closest("a")) setMobileOpen(false); }}>
        <AdminNav collapsed={collapsed} />
      </div>
      <form action="/api/admin/logout" method="POST">
        <button type="submit" className={styles.logout} aria-label="Sign out">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" />
          </svg>
          <span>Sign out</span>
        </button>
      </form>
      </aside>
    </>
  );
}
