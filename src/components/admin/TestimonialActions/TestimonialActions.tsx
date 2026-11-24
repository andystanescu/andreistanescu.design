"use client";
import type { FormEvent } from "react";
import { AdminIcon } from "@/components/admin/AdminIcon/AdminIcon";
import styles from "@/app/admin/(dashboard)/admin.module.css";

export function TestimonialActions({ id, name, published }: { id: number; name: string; published: boolean }) {
  function confirmDelete(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm(`Permanently delete the testimonial from “${name}”?`)) event.preventDefault();
  }
  return <>
    <form action="/api/admin/testimonials" method="post"><input type="hidden" name="id" value={id} /><input type="hidden" name="action" value="toggle" /><label className={styles.checkboxField}><input type="checkbox" role="switch" name="published" defaultChecked={published} onChange={(event) => event.currentTarget.form?.requestSubmit()} aria-label={`Publish testimonial from ${name}`} /><span className={styles.switch} aria-hidden="true" /><span className="body-small">{published ? "Published" : "Draft"}</span></label><noscript><button type="submit">Update status</button></noscript></form>
    <form action="/api/admin/testimonials" method="post" onSubmit={confirmDelete} className={styles.deleteForm}><input type="hidden" name="id" value={id} /><button className={styles.deleteButton} name="action" value="delete" aria-label={`Delete testimonial from ${name}`} title="Delete testimonial"><AdminIcon name="action-delete" /></button></form>
  </>;
}
