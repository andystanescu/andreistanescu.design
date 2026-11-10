"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminIcon } from "@/components/admin/AdminIcon/AdminIcon";
import styles from "./AdminNav.module.css";

const GROUPS = [
  { label: "", items: [{ label: "Dashboard", href: "/admin", icon: "admin-dashboard" }, { label: "Site identity", href: "/admin/site-identity", icon: "admin-site-identity" }, { label: "Navigation", href: "/admin/pages", icon: "admin-navigation" }] },
  { label: "Pages", items: [{ label: "Homepage", href: "/admin/homepage", icon: "admin-homepage" }, { label: "About me", href: "/admin/about", icon: "admin-about-page" }, { label: "Contact", href: "/admin/contact", icon: "network-mail" }, { label: "Privacy policy", href: "/admin/privacy", icon: "admin-privacy-policy" }, { label: "Terms of service", href: "/admin/terms", icon: "admin-terms-of-service" }] },
  { label: "Content", items: [{ label: "Services", href: "/admin/services", icon: "admin-services" }, { label: "Approach steps", href: "/admin/approach-steps", icon: "admin-approach-steps" }, { label: "Case studies", href: "/admin/case-studies", icon: "admin-case-studies" }, { label: "Insights", href: "/admin/insights", icon: "admin-insights" }] },
  { label: "System", items: [{ label: "Content transfer", href: "/admin/content-transfer", icon: "admin-content-transfer" }, { label: "Settings", href: "/admin/settings", icon: "action-settings" }, { label: "Submissions", href: "/admin/submissions", icon: "admin-submissions" }] },
] as const;
const NESTED_UNDER: Record<string, string> = { "/admin/about-philosophy": "/admin/about", "/admin/about-highlights": "/admin/about" };

export function AdminNav({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();
  const effectivePath = NESTED_UNDER[pathname] ?? pathname;
  const isActive = (href: string) => href === "/admin" ? effectivePath === href : effectivePath.startsWith(href);
  return <nav className={`${styles.nav} ${collapsed ? styles.navCollapsed : ""}`} aria-label="Admin">{GROUPS.map((group) => <div className={styles.group} key={group.label || "dashboard"}>{group.label && <p className={styles.groupLabel}>{group.label}</p>}<div className={styles.groupItems}>{group.items.map((item) => <Link key={item.href} href={item.href} aria-label={item.label} title={collapsed ? item.label : undefined} aria-current={isActive(item.href) ? "page" : undefined} className={`${styles.navLink} ${isActive(item.href) ? styles.navLinkActive : ""}`}><AdminIcon name={item.icon} className={styles.icon} /><span className={styles.linkLabel}>{item.label}</span></Link>)}</div></div>)}</nav>;
}

