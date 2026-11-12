"use client";

import type { FormEvent } from "react";
import { AdminIcon } from "@/components/admin/AdminIcon/AdminIcon";
import adminStyles from "@/app/admin/(dashboard)/admin.module.css";

export function CategoryDeleteActions({ id, name, hasService }: { id: number; name: string; hasService: boolean }) {
  function confirmDelete(event: FormEvent<HTMLFormElement>) {
    const message = `Permanently delete “${name}”${hasService ? " and its dedicated service page" : ""}? Its category assignments will be removed from case studies and articles. The case studies and articles themselves will remain.`;
    if (!window.confirm(message)) event.preventDefault();
  }
  return <form action={`/api/admin/categories/${id}/delete`} method="POST" onSubmit={confirmDelete} className={adminStyles.deleteForm}>
    <button type="submit" className={adminStyles.deleteButton} aria-label={`Delete ${name}`} title="Delete category and service"><AdminIcon name="action-delete" /></button>
  </form>;
}
