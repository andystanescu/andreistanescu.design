import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import type { AboutItem } from "@/lib/about";
import { ImageField } from "@/components/admin/ImageField/ImageField";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function EditHighlightItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const item = db
    .prepare("SELECT * FROM about_highlight_items WHERE id = ?")
    .get(id) as AboutItem | undefined;

  if (!item) {
    notFound();
  }

  return (
    <>
      <h1 className="heading-01">Edit highlight item</h1>
      {error && <p style={{ color: "var(--border-error)" }}>{error}</p>}
      <form
        className={styles.form}
        action={`/api/admin/about-highlights/${item.id}`}
        method="POST"
        encType="multipart/form-data"
      >
        <label className={styles.field}>
          <span className="label-small" style={{ color: "var(--text-secondary)" }}>
            Title
          </span>
          <input
            type="text"
            name="title"
            defaultValue={item.title}
            required
            className={styles.input}
          />
        </label>

        <label className={styles.field}>
          <span className="label-small" style={{ color: "var(--text-secondary)" }}>
            Description
          </span>
          <textarea
            name="description"
            defaultValue={item.description}
            required
            className={styles.textarea}
          />
        </label>

        <label className={styles.field}>
          <span className="label-small" style={{ color: "var(--text-secondary)" }}>
            Icon
          </span>
          <ImageField name="icon" currentUrl={item.icon} />
        </label>

        <label className={styles.checkboxField}>
          <input type="checkbox" name="published" defaultChecked={!!item.published} />
          <span className="body-default">Published</span>
        </label>

        <div className={styles.formActions}>
          <button type="submit" className={styles.submit}>
            <span className="label-button">Save changes</span>
          </button>
        </div>
      </form>
    </>
  );
}
