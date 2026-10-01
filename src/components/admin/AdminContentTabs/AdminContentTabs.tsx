"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import styles from "./AdminContentTabs.module.css";

export type AdminContentTab = { id: string; label: string; content: ReactNode };

export function AdminContentTabs({ tabs, initialTab }: { tabs: AdminContentTab[]; initialTab?: string }) {
  const [active, setActive] = useState(initialTab || tabs[0]?.id || "");
  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else return;

    event.preventDefault();
    setActive(tabs[nextIndex].id);
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex]
      ?.focus();
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.tabs} role="tablist" aria-label="Content editor sections">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" role="tab" tabIndex={active === tab.id ? 0 : -1} aria-selected={active === tab.id} aria-controls={`admin-panel-${tab.id}`} className={active === tab.id ? styles.active : styles.tab} onKeyDown={(event) => handleTabKeyDown(event, tabs.indexOf(tab))} onClick={() => setActive(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => <section key={tab.id} id={`admin-panel-${tab.id}`} role="tabpanel" hidden={active !== tab.id} aria-label={tab.label}>{tab.content}</section>)}
    </div>
  );
}
