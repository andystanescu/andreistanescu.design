"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { AdminIcon } from "@/components/admin/AdminIcon/AdminIcon";
import styles from "./AdminNav.module.css";

const GROUPS = [
  { label: "", items: [{ label: "Dashboard", href: "/admin", icon: "admin-dashboard" }, { label: "Site identity", href: "/admin/site-identity", icon: "admin-site-identity" }, { label: "Navigation", href: "/admin/pages", icon: "admin-navigation" }] },
  { label: "Pages", items: [{ label: "Homepage", href: "/admin/homepage", icon: "admin-homepage" }, { label: "About me", href: "/admin/about", icon: "admin-about-page" }, { label: "Contact", href: "/admin/contact", icon: "network-mail" }, { label: "Privacy policy", href: "/admin/privacy", icon: "admin-privacy-policy" }, { label: "Terms of service", href: "/admin/terms", icon: "admin-terms-of-service" }] },
  { label: "Content", items: [{ label: "Services", href: "/admin/categories", icon: "admin-services" }, { label: "Approach steps", href: "/admin/approach-steps", icon: "admin-approach-steps" }, { label: "Testimonials", href: "/admin/testimonials", icon: "admin-about-page" }, { label: "Case studies", href: "/admin/case-studies", icon: "admin-case-studies" }, { label: "Insights", href: "/admin/insights", icon: "admin-insights" }] },
  { label: "System", items: [{ label: "Content transfer", href: "/admin/content-transfer", icon: "admin-content-transfer" }, { label: "Submissions", href: "/admin/submissions", icon: "admin-submissions" }] },
] as const;
const NESTED_UNDER: Record<string, string> = { "/admin/about-philosophy": "/admin/about", "/admin/about-highlights": "/admin/about", "/admin/services/settings": "/admin/categories" };

const MOBILE_GROUPS = [
  { label: "Site", items: GROUPS[0].items.slice(1) },
  ...GROUPS.slice(1),
];

export function adminLocation(pathname: string) {
  const effectivePath = NESTED_UNDER[pathname] ?? pathname;
  for (const group of MOBILE_GROUPS) {
    const item = group.items.find((entry) => effectivePath === entry.href || effectivePath.startsWith(`${entry.href}/`));
    if (item) return { group: group.label, label: item.label };
  }
  return { group: "Admin", label: pathname.startsWith("/admin/design-system") ? "Design system" : "Dashboard" };
}

export function MobileAdminNav({ servicesEnabled = true, insightsEnabled = true }: { servicesEnabled?: boolean; insightsEnabled?: boolean }) {
  const pathname = usePathname();
  const current = adminLocation(pathname);
  const [open, setOpen] = useState<string[]>([current.group]);
  return <nav className={styles.mobileNav} aria-label="Admin">
    <Link href="/admin" aria-current={pathname === "/admin" ? "page" : undefined} className={`${styles.mobileLink} ${pathname === "/admin" ? styles.mobileLinkActive : ""}`}><AdminIcon name="admin-dashboard" className={styles.icon} /><span>Dashboard</span></Link>
    {MOBILE_GROUPS.map((group) => {
      const items = group.items.filter((item) => insightsEnabled || item.href !== "/admin/insights");
      const expanded = open.includes(group.label);
      return <div key={group.label} className={styles.mobileGroup}>
        <button type="button" className={styles.mobileGroupToggle} aria-expanded={expanded} onClick={() => setOpen((previous) => expanded ? previous.filter((label) => label !== group.label) : [...previous, group.label])}>
          <span>{group.label}</span><span>{items.length}</span><AdminIcon name={expanded ? "action-minus" : "action-plus"} />
        </button>
        {expanded && <div>{items.map((item) => {
          const active = current.label === item.label && current.group === group.label;
          return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`${styles.mobileLink} ${active ? styles.mobileLinkActive : ""}`}><AdminIcon name={item.icon} className={styles.icon} /><span>{item.href === "/admin/categories" && !servicesEnabled ? "Categories" : item.label}</span></Link>;
        })}</div>}
      </div>;
    })}
  </nav>;
}

export function AdminNav({ collapsed = false, servicesEnabled = true, insightsEnabled = true }: { collapsed?: boolean; servicesEnabled?: boolean; insightsEnabled?: boolean }) {
  const pathname = usePathname();
  const effectivePath = NESTED_UNDER[pathname] ?? pathname;
  const isActive = (href: string) => href === "/admin" ? effectivePath === href : effectivePath.startsWith(href);
  return <nav className={`${styles.nav} ${collapsed ? styles.navCollapsed : ""}`} aria-label="Admin">{GROUPS.map((group) => <div className={styles.group} key={group.label || "dashboard"}>{group.label && <p className={styles.groupLabel}>{group.label}</p>}<div className={styles.groupItems}>{group.items.filter((item) => insightsEnabled || item.href !== "/admin/insights").map((item) => { const label = item.href === "/admin/categories" && !servicesEnabled ? "Categories" : item.label; return <Link key={item.href} href={item.href} aria-label={label} title={collapsed ? label : undefined} aria-current={isActive(item.href) ? "page" : undefined} className={`${styles.navLink} ${isActive(item.href) ? styles.navLinkActive : ""}`}><AdminIcon name={item.icon} className={styles.icon} /><span className={styles.linkLabel}>{label}</span></Link>; })}</div></div>)}</nav>;
}

