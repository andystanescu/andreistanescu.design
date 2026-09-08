"use client";

import { useState, type ReactNode } from "react";
import styles from "./AdminContentTabs.module.css";

export type AdminContentTab = { id: string; label: string; content: ReactNode };

export function AdminContentTabs({ tabs, initialTab }: { tabs: AdminContentTab[]; initialTab?: string }) {
  const [active, setActive] = useState(initialTab || tabs[0]?.id || "");
  return (
    <div className={styles.wrapper}>
      <div className={styles.tabs} role="tablist" aria-label="Content editor sections">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" role="tab" aria-selected={active === tab.id} aria-controls={`admin-panel-${tab.id}`} className={active === tab.id ? styles.active : styles.tab} onClick={() => setActive(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => <section key={tab.id} id={`admin-panel-${tab.id}`} role="tabpanel" hidden={active !== tab.id} aria-label={tab.label}>{tab.content}</section>)}
    </div>
  );
}
