"use client";

import styles from "@/app/admin/(dashboard)/admin.module.css";

export function ServiceToggle({ categoryId, enabled, name }: { categoryId: number; enabled: boolean; name: string }) {
  return <form action={`/api/admin/categories/${categoryId}/service`} method="POST">
    <label className={styles.checkboxField}>
      <input type="checkbox" role="switch" name="enabled" value="1" defaultChecked={enabled} onChange={(event) => event.currentTarget.form?.requestSubmit()} aria-label={`Dedicated service for ${name}`} />
      <span className={styles.switch} aria-hidden="true" />
      <span className="body-small">Dedicated service {enabled ? "on" : "off"}</span>
    </label>
    <noscript><button type="submit">Update service</button></noscript>
  </form>;
}
