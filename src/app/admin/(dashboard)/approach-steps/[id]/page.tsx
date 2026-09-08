import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import type { ApproachStep } from "@/lib/approachSteps";
import { ImageField } from "@/components/admin/ImageField/ImageField";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function EditApproachStepPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const step = db
    .prepare("SELECT * FROM approach_steps WHERE id = ?")
    .get(id) as ApproachStep | undefined;

  if (!step) {
    notFound();
  }

  return (
    <>
      <h1 className="heading-01">Edit step</h1>
      {error && <p style={{ color: "var(--border-error)" }}>{error}</p>}
      <form
        className={styles.form}
        action={`/api/admin/approach-steps/${step.id}`}
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
            defaultValue={step.title}
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
            defaultValue={step.description}
            required
            className={styles.textarea}
          />
        </label>

        <label className={styles.field}>
          <span className="label-small" style={{ color: "var(--text-secondary)" }}>
            Icon
          </span>
          <ImageField name="icon" currentUrl={step.icon} />
        </label>

        <label className={styles.checkboxField}>
          <input
            type="checkbox"
            name="show_on_homepage"
            defaultChecked={!!step.show_on_homepage}
          />
          <span className="body-default">Show on homepage</span>
        </label>

        <label className={styles.checkboxField}>
          <input type="checkbox" name="published" defaultChecked={!!step.published} />
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
