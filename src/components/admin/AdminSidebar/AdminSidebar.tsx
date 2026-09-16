"use client";

import { useState } from "react";
import { Logo } from "@/components/Logo/Logo";
import { AdminNav } from "@/components/admin/AdminNav/AdminNav";
import { ViewSiteLink } from "@/components/admin/ViewSiteLink/ViewSiteLink";
import styles from "@/app/admin/(dashboard)/dashboard.module.css";

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  function toggleSidebar() {
    setCollapsed((current) => !current);
  }

  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}
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
      </div>
      <ViewSiteLink />
      <AdminNav collapsed={collapsed} />
      <form action="/api/admin/logout" method="POST">
        <button type="submit" className={styles.logout} aria-label="Sign out">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" />
          </svg>
          <span>Sign out</span>
        </button>
      </form>
    </aside>
  );
}
