"use client";

import { useEffect, useState } from "react";
import { AdminIcon } from "@/components/admin/AdminIcon/AdminIcon";
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
      setHref(saved.split("#", 1)[0] || "/");
    }
  }, []);

  return (
    <a href={href} className={styles.viewSiteLink} aria-label="View site" title="View site">
      <AdminIcon name="direction-external" />
      <span>View site</span>
    </a>
  );
}
