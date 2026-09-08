"use client";

import { useState } from "react";
import styles from "./ShareArticle.module.css";

export function ShareArticle({ title, contentType = "article", contentId = "" }: { title: string; contentType?: "article" | "case_study"; contentId?: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  function getUrl() {
    return typeof window === "undefined" ? "" : window.location.href;
  }

  async function share() {
    const url = getUrl();
    void fetch("/api/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventType: "share", contentType, contentId }) }).catch(() => undefined);
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => undefined);
      return;
    }
    setOpen((value) => !value);
  }

  async function copyLink() {
    void fetch("/api/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventType: "share", contentType, contentId }) }).catch(() => undefined);
    await navigator.clipboard?.writeText(getUrl());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const url = encodeURIComponent(getUrl());
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className={styles.share}>
      <button type="button" className={styles.button} onClick={share} aria-expanded={open}>
        Share article <span aria-hidden="true">↗</span>
      </button>
      {open && (
        <div className={styles.menu} role="menu">
          <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${url}`} target="_blank" rel="noreferrer" role="menuitem">LinkedIn</a>
          <a href={`https://twitter.com/intent/tweet?url=${url}&text=${encodedTitle}`} target="_blank" rel="noreferrer" role="menuitem">X</a>
          <a href={`mailto:?subject=${encodedTitle}&body=${url}`} role="menuitem">Email</a>
          <button type="button" onClick={copyLink} role="menuitem">{copied ? "Copied" : "Copy link"}</button>
        </div>
      )}
    </div>
  );
}
