"use client";

import styles from "@/app/admin/(dashboard)/admin.module.css";
import type { FormEvent } from "react";

export function SubmissionActions({ id, category }: { id: number; category: "submitted" | "failed" | "blocked" }) {
  function confirmDelete(event: FormEvent<HTMLFormElement>) {
    const action = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (action?.value === "delete" && !window.confirm("Delete this submission permanently?")) event.preventDefault();
  }
  return <form action={`/api/admin/submissions/${id}`} method="POST" className={styles.submissionActions} onSubmit={confirmDelete}>
    {category === "failed" && <button type="submit" name="action" value="retry" className={styles.tertiaryButton}>Retry</button>}
    {category === "blocked" && <button type="submit" name="action" value="unblock" className={styles.tertiaryButton}>Unblock</button>}
    <button type="submit" name="action" value="delete" className={styles.tertiaryButton}>Delete</button>
  </form>;
}
