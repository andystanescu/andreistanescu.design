"use client";

import { useEffect, useState } from "react";
import styles from "@/app/admin/(dashboard)/dashboard.module.css";

export function ViewSiteLink() {
  const [href, setHref] = useState("/");

  useEffect(() => {
    const saved = window.localStorage.getItem("conScept-last-public-location");
    // Older sessions may contain an admin URL. Never allow the admin shortcut
    // to point back into the protected area; fall back to the public home page
    // until a valid public location has been recorded.
    if (
      saved &&
      saved.startsWith("/") &&
      !saved.startsWith("/admin") &&
      !saved.startsWith("/api")
    ) {
      setHref(saved);
    }
  }, []);

  return (
    <a href={href} className={styles.viewSiteLink} aria-label="View site">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 5h5v5M19 5l-8 8M19 13v6H5V5h6" />
      </svg>
      <span>View site</span>
    </a>
  );
}
