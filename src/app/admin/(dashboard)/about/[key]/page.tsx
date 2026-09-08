import { notFound } from "next/navigation";
import { getSection } from "@/lib/about";
import { getSettings } from "@/lib/settings";
import { ImageField } from "@/components/admin/ImageField/ImageField";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

const LABELS: Record<string, string> = {
  hero: "Hero",
  drives_me: "What Drives Me",
  philosophy: "Philosophy",
  highlights: "Highlights",
  latest_insights: "Latest Insights",
};

export default async function EditAboutSectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { key } = await params;
  const { error } = await searchParams;
  const section = getSection(key);
  const settings = getSettings();

  if (!section) {
    notFound();
  }

  return (
    <>
      <h1 className="heading-01">Edit about page: {LABELS[key] ?? key}</h1>
      {error && <p style={{ color: "var(--border-error)" }}>{error}</p>}
      <form
        className={styles.form}
        action={`/api/admin/about/${section.key}`}
        method="POST"
        encType="multipart/form-data"
      >
        <label className={styles.field}>
          <span className="label-small" style={{ color: "var(--text-secondary)" }}>
            Eyebrow
          </span>
          <input
            type="text"
            name="eyebrow"
            defaultValue={section.eyebrow}
            className={styles.input}
          />
        </label>

        {section.key === "hero" && (
          <div className={styles.field}>
            <span className="label-small" style={{ color: "var(--text-secondary)" }}>
              Personal About image
            </span>
            <ImageField name="about_hero_image" currentUrl={settings.about_hero_image || undefined} />
            <span className="body-small" style={{ color: "var(--text-tertiary)" }}>
              Used beside the copy in Personal mode. If no image is uploaded, the personal logo is shown instead.
            </span>
          </div>
        )}

        <label className={styles.field}>
          <span className="label-small" style={{ color: "var(--text-secondary)" }}>
            Headline (wrap a word in #like this# for orange)
          </span>
          <input
            type="text"
            name="headline"
            defaultValue={section.headline}
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
            defaultValue={section.description}
            className={styles.textarea}
          />
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
