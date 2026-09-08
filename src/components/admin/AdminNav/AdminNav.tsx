"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import styles from "./AdminNav.module.css";

const GROUPS = [
  { label: "", items: [{ label: "Dashboard", href: "/admin", icon: "dashboard" }] },
  { label: "Pages", items: [{ label: "Homepage", href: "/admin/homepage", icon: "home" }, { label: "About page", href: "/admin/about", icon: "about" }, { label: "Pages", href: "/admin/pages", icon: "pages" }] },
  { label: "Content", items: [{ label: "Services", href: "/admin/services", icon: "services" }, { label: "Approach steps", href: "/admin/approach-steps", icon: "approach" }, { label: "Case studies", href: "/admin/case-studies", icon: "caseStudies" }, { label: "Insights", href: "/admin/insights", icon: "insights" }] },
  { label: "System", items: [{ label: "Content transfer", href: "/admin/content-transfer", icon: "transfer" }, { label: "Settings", href: "/admin/settings", icon: "settings" }, { label: "Submissions", href: "/admin/submissions", icon: "submissions" }] },
] as const;
const NESTED_UNDER: Record<string, string> = { "/admin/about-philosophy": "/admin/about", "/admin/about-highlights": "/admin/about" };

export function AdminNav() {
  const pathname = usePathname();
  const effectivePath = NESTED_UNDER[pathname] ?? pathname;
  const isActive = (href: string) => href === "/admin" ? effectivePath === href : effectivePath.startsWith(href);
  return <nav className={styles.nav} aria-label="Admin">{GROUPS.map((group) => <div className={styles.group} key={group.label || "dashboard"}>{group.label && <p className={styles.groupLabel}>{group.label}</p>}<div className={styles.groupItems}>{group.items.map((item) => <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? "page" : undefined} className={`${styles.navLink} ${isActive(item.href) ? styles.navLinkActive : ""}`}><AdminIcon name={item.icon} />{item.label}</Link>)}</div></div>)}</nav>;
}

function AdminIcon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9" /><path d="M9 20v-6h6v6" /></>,
    about: <><circle cx="12" cy="7" r="3.5" /><path d="M5 21c.7-4 2.7-6 7-6s6.3 2 7 6" /></>,
    pages: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5M9 12h6M9 16h6" /></>,
    services: <><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M8 6V4h8v2M3 11h18M10 11v2h4v-2" /></>,
    approach: <><path d="m12 3 8 4-8 4-8-4zM4 12l8 4 8-4M4 17l8 4 8-4" /></>,
    caseStudies: <><path d="M4 5h16v14H4z" /><path d="M8 9h8M8 13h5" /></>,
    insights: <><path d="M5 4h14v16H5z" /><path d="m8 16 3-3 2 2 3-4" /></>,
    transfer: <><path d="M7 7h10M7 17h10" /><path d="m14 4 3 3-3 3M10 14l-3 3 3 3" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19 15.5a2 2 0 0 0 .4 2.2l.1.1-1.5 1.5-.1-.1a2 2 0 0 0-2.2-.4 2 2 0 0 0-1.2 1.8v.2h-2.1v-.2a2 2 0 0 0-1.2-1.8 2 2 0 0 0-2.2.4l-.1.1-1.5-1.5.1-.1a2 2 0 0 0 .4-2.2A2 2 0 0 0 7.9 14h-.2v-2h.2a2 2 0 0 0 1.8-1.2 2 2 0 0 0-.4-2.2l-.1-.1 1.5-1.5.1.1" /></>,
    submissions: <><path d="M4 5h16v14H4z" /><path d="m4 7 8 6 8-6" /></>,
  };
  return <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}
