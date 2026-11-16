"use client";

import type { FormEvent } from "react";
import { AdminIcon } from "@/components/admin/AdminIcon/AdminIcon";
import adminStyles from "@/app/admin/(dashboard)/admin.module.css";

export function CategoryDeleteActions({ id, name, hasService, insightsEnabled = true }: { id: number; name: string; hasService: boolean; insightsEnabled?: boolean }) {
  function confirmDelete(event: FormEvent<HTMLFormElement>) {
    const message = `Permanently delete “${name}”${hasService ? " and its dedicated service page" : ""}? Its category assignments will be removed from case studies${insightsEnabled ? " and articles" : ""}. The content itself will remain.`;
    if (!window.confirm(message)) event.preventDefault();
  }
  return <form action={`/api/admin/categories/${id}/delete`} method="POST" onSubmit={confirmDelete} className={adminStyles.deleteForm}>
    <button type="submit" className={adminStyles.deleteButton} aria-label={`Delete ${name}`} title={hasService ? "Delete category and service" : "Delete category"}><AdminIcon name="action-delete" /></button>
  </form>;
}
