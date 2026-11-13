import { notFound } from "next/navigation";
import { DEDICATED_PAGE_PATHS, getPage } from "@/lib/pages";
import { RichTextEditor } from "@/components/admin/RichTextEditor/RichTextEditor";
import { MetadataFields } from "@/components/admin/MetadataFields/MetadataFields";
import { AdminContentTabs } from "@/components/admin/AdminContentTabs/AdminContentTabs";
import { getSettings } from "@/lib/settings";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function EditPagePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;
  const page = getPage(slug);

  if (!page) {
    notFound();
  }
  const dedicatedPath = DEDICATED_PAGE_PATHS[slug];
  const contactSettings = slug === "contact" ? getSettings() : null;
  const emailConfigured = Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_EMAIL_FROM);

  return (
    <>
      {error && <p style={{ color: "var(--border-error)" }}>{error}</p>}
      <form
        className={styles.form}
        action={`/api/admin/pages/${page.slug}`}
        method="POST"
      >
        {dedicatedPath && <input type="hidden" name="redirect" value={dedicatedPath} />}
        <AdminContentTabs header={<div className={styles.pageHeader}><h1 className="heading-01">Edit page: {page.title}</h1></div>} tabs={[
          { id: "details", label: "Details", content: <div>
        <label className={styles.field}>
          <span className="label-small" style={{ color: "var(--text-secondary)" }}>
            Eyebrow
          </span>
          <input
            type="text"
            name="eyebrow"
            defaultValue={page.eyebrow}
            className={styles.input}
          />
        </label>

        {page.slug !== "home" && (
          <label className={styles.checkboxField}>
            <input type="checkbox" name="visible" defaultChecked={!!page.visible} />
            <span className={styles.switch} aria-hidden="true" />
            <span className="body-default">Publish page on the site</span>
          </label>
        )}

        <label className={styles.field}>
          <span className="label-small" style={{ color: "var(--text-secondary)" }}>
            Title
          </span>
          <input
            type="text"
            name="title"
            defaultValue={page.title}
            required
            className={styles.input}
          />
        </label>

        <label className={styles.checkboxField}>
          <input
            type="checkbox"
            name="show_in_nav"
            defaultChecked={!!page.show_in_nav}
          />
          <span className={styles.switch} aria-hidden="true" />
          <span className="body-default">Show in main nav</span>
        </label>

        <label className={styles.field}>
          <span className="label-small" style={{ color: "var(--text-secondary)" }}>
            Nav label (optional — defaults to the title above)
          </span>
          <input
            type="text"
            name="nav_label"
            defaultValue={page.nav_label}
            placeholder={page.title}
            className={styles.input}
          />
        </label>

        <label className={`${styles.field} ${styles.fieldWide}`}>
          <span className="label-small" style={{ color: "var(--text-secondary)" }}>
            Body
          </span>
          <RichTextEditor name="body" defaultValue={page.body} />
        </label>

        </div> },
          { id: "metadata", label: "Metadata and SEO", content: <div className={styles.field}><span className="label-eyebrow">Metadata and SEO</span><MetadataFields values={page} /></div> },
          ...(contactSettings ? [{ id: "contact-form", label: "Contact form", content: <div>
            <input type="hidden" name="contact_settings_present" value="1" />
            {!emailConfigured && <p className={`body-small ${styles.helper}`}>Email delivery is not configured. Submissions will be stored but not emailed until RESEND_API_KEY and CONTACT_EMAIL_FROM are set. See .env.local.example.</p>}
            <label className={styles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>Send submissions to</span><input type="email" name="contact_email_to" defaultValue={contactSettings.contact_email_to} placeholder="you@example.com" className={styles.input} /></label>
            <label className={styles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>Confirmation message: title</span><input type="text" name="confirmation_title" defaultValue={contactSettings.confirmation_title} className={styles.input} /></label>
            <label className={styles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>Confirmation message: body</span><textarea name="confirmation_body" defaultValue={contactSettings.confirmation_body} className={styles.textarea} /></label>
          </div> }] : []),
        ]} />

        <div className={styles.formActions}>
          <a href={dedicatedPath || "/admin/pages"} className={styles.tertiaryButton}>Cancel</a>
          <button type="submit" className={styles.submit}>
            <span className="label-button">Save changes</span>
          </button>
        </div>
      </form>
    </>
  );
}
