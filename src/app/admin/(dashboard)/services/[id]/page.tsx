import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import type { ServiceItem } from "@/lib/serviceItems";
import { ImageField } from "@/components/admin/ImageField/ImageField";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function EditServicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const service = db
    .prepare("SELECT * FROM service_items WHERE id = ?")
    .get(id) as ServiceItem | undefined;

  if (!service) {
    notFound();
  }

  return (
    <>
      <h1 className="heading-01">Edit service</h1>
      {error && <p style={{ color: "var(--border-error)" }}>{error}</p>}
      <form
        className={styles.form}
        action={`/api/admin/services/${service.id}`}
        method="POST"
        encType="multipart/form-data"
      >
        <label className={styles.field}>
          <span className="label-small" style={{ color: "var(--text-secondary)" }}>
            Slug (used in the URL: /services/…)
          </span>
          <input
            type="text"
            name="slug"
            defaultValue={service.slug}
            required
            className={styles.input}
          />
        </label>

        <label className={styles.field}>
          <span className="label-small" style={{ color: "var(--text-secondary)" }}>
            Title
          </span>
          <input
            type="text"
            name="title"
            defaultValue={service.title}
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
            defaultValue={service.description}
            required
            className={styles.textarea}
          />
        </label>

        <label className={styles.checkboxField}>
          <input type="checkbox" name="card_size" defaultChecked={service.card_size === "large"} />
          <span className={styles.switch} aria-hidden="true" />
          <span className="body-default">Use large card on Services page</span>
        </label>

        <label className={styles.field}>
          <span className="label-small" style={{ color: "var(--text-secondary)" }}>
            Icon
          </span>
          <ImageField name="icon" currentUrl={service.icon} />
        </label>

        <label className={styles.checkboxField}>
          <input
            type="checkbox"
            name="show_on_homepage"
            defaultChecked={!!service.show_on_homepage}
          />
          <span className={styles.switch} aria-hidden="true" />
          <span className="body-default">Show on homepage</span>
        </label>

        <label className={styles.checkboxField}>
          <input type="checkbox" name="published" defaultChecked={!!service.published} />
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
