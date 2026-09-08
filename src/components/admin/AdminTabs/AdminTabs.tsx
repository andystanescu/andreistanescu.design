import Link from "next/link";
import styles from "./AdminTabs.module.css";

type Tab = {
  label: string;
  href: string;
};

type AdminTabsProps = {
  tabs: Tab[];
  /** href of the tab that owns the page currently being rendered. */
  active: string;
  embedded?: boolean;
};

// Sibling admin routes (each its own server component with its own data
// fetch) that belong to the same page conceptually — e.g. About's
// Sections/Philosophy/Highlights. This renders the tab strip that links
// between them; it doesn't change routing, just how it's presented.
export function AdminTabs({ tabs, active, embedded = false }: AdminTabsProps) {
  return (
    <div className={`${styles.tabs} ${embedded ? styles.embedded : ""}`} role="tablist">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          role="tab"
          aria-selected={tab.href === active}
          className={`${styles.tab} ${tab.href === active ? styles.tabActive : ""}`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
