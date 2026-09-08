import { ImageField } from "@/components/admin/ImageField/ImageField";
import styles from "../../admin.module.css";

export default async function NewServicePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <>
      <h1 className="heading-01">New service</h1>
      {error && <p style={{ color: "var(--border-error)" }}>{error}</p>}
      <form
        className={styles.form}
        action="/api/admin/services"
        method="POST"
        encType="multipart/form-data"
      >
        <label className={styles.field}>
          <span className="label-small" style={{ color: "var(--text-secondary)" }}>
            Slug (used in the URL: /services/…)
          </span>
          <input type="text" name="slug" required className={styles.input} />
        </label>

        <label className={styles.field}>
          <span className="label-small" style={{ color: "var(--text-secondary)" }}>
            Title
          </span>
          <input type="text" name="title" required className={styles.input} />
        </label>

        <label className={styles.field}>
          <span className="label-small" style={{ color: "var(--text-secondary)" }}>
            Description (shown on cards and listings)
          </span>
          <textarea name="description" required className={styles.textarea} />
        </label>

        <label className={styles.checkboxField}>
          <input type="checkbox" name="card_size" />
          <span className={styles.switch} aria-hidden="true" />
          <span className="body-default">Use large card on Services page</span>
        </label>

        <label className={styles.field}>
          <span className="label-small" style={{ color: "var(--text-secondary)" }}>
            Icon
          </span>
          <ImageField name="icon" />
        </label>

        <label className={styles.checkboxField}>
          <input type="checkbox" name="show_on_homepage" defaultChecked />
          <span className={styles.switch} aria-hidden="true" />
          <span className="body-default">Show on homepage</span>
        </label>

        <label className={styles.checkboxField}>
          <input type="checkbox" name="published" defaultChecked />
          <span className="body-default">Published</span>
        </label>

        <div className={styles.formActions}>
          <button type="submit" className={styles.submit}>
            <span className="label-button">Create service</span>
          </button>
        </div>
      </form>
    </>
  );
}
