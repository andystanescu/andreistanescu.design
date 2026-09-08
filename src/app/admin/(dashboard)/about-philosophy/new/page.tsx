import { ImageField } from "@/components/admin/ImageField/ImageField";
import styles from "../../admin.module.css";

export default async function NewPhilosophyItemPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <>
      <h1 className="heading-01">New philosophy item</h1>
      {error && <p style={{ color: "var(--border-error)" }}>{error}</p>}
      <form
        className={styles.form}
        action="/api/admin/about-philosophy"
        method="POST"
        encType="multipart/form-data"
      >
        <label className={styles.field}>
          <span className="label-small" style={{ color: "var(--text-secondary)" }}>
            Title
          </span>
          <input type="text" name="title" required className={styles.input} />
        </label>

        <label className={styles.field}>
          <span className="label-small" style={{ color: "var(--text-secondary)" }}>
            Description
          </span>
          <textarea name="description" required className={styles.textarea} />
        </label>

        <label className={styles.field}>
          <span className="label-small" style={{ color: "var(--text-secondary)" }}>
            Icon
          </span>
          <ImageField name="icon" />
        </label>

        <label className={styles.checkboxField}>
          <input type="checkbox" name="published" defaultChecked />
          <span className="body-default">Published</span>
        </label>

        <div className={styles.formActions}>
          <button type="submit" className={styles.submit}>
            <span className="label-button">Create item</span>
          </button>
        </div>
      </form>
    </>
  );
}
