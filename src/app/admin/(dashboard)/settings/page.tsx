import Link from "next/link";
import { getSettings } from "@/lib/settings";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = getSettings();
  const emailConfigured = Boolean(
    process.env.RESEND_API_KEY && process.env.CONTACT_EMAIL_FROM
  );

  return (
    <>
      <h1 className="heading-01">Settings</h1>

      {!emailConfigured && (
        <p className={`body-small ${styles.helper}`} style={{ maxWidth: 640 }}>
          RESEND_API_KEY / CONTACT_EMAIL_FROM aren&apos;t set in the
          environment yet, so submissions will be stored but not emailed even
          once you set an address below. See .env.local.example.
        </p>
      )}

      <p className={`body-small ${styles.helper}`} style={{ maxWidth: 640 }}>
        Main menu visibility and order now live on each page in{" "}
        <Link href="/admin/pages">Pages</Link>.
      </p>

      <form
        className={styles.form}
        action="/api/admin/settings"
        method="POST"
        encType="multipart/form-data"
      >
        <label className={styles.field}>
          <span className="label-small" style={{ color: "var(--text-secondary)" }}>Author name</span>
          <input type="text" name="author_name" defaultValue={settings.author_name} placeholder="Andrei Stanescu" className={styles.input} />
          <span className="body-small" style={{ color: "var(--text-tertiary)" }}>Automatically applied when articles and case studies are saved.</span>
        </label>

        <label className={styles.field}>
          <span className="label-small" style={{ color: "var(--text-secondary)" }}>
            Personal About CV (PDF)
          </span>
          <input type="file" name="about_cv" accept="application/pdf,.pdf" className={styles.input} />
          {settings.about_cv && (
            <a href={settings.about_cv} target="_blank" rel="noreferrer" className="body-small">
              View current CV
            </a>
          )}
          <span className="body-small" style={{ color: "var(--text-tertiary)" }}>
            Downloaded by the Download CV button on the Personal About page. Leave empty to keep the current file.
          </span>
        </label>

        <label className={styles.field}>
          <span className="label-small" style={{ color: "var(--text-secondary)" }}>
            Contact form: send submissions to
          </span>
          <input
            type="email"
            name="contact_email_to"
            defaultValue={settings.contact_email_to}
            placeholder="you@conscept.com"
            className={styles.input}
          />
        </label>

        <label className={styles.field}>
          <span className="label-small" style={{ color: "var(--text-secondary)" }}>
            Confirmation message: title
          </span>
          <input
            type="text"
            name="confirmation_title"
            defaultValue={settings.confirmation_title}
            className={styles.input}
          />
        </label>

        <label className={styles.field}>
          <span className="label-small" style={{ color: "var(--text-secondary)" }}>
            Confirmation message: body
          </span>
          <textarea
            name="confirmation_body"
            defaultValue={settings.confirmation_body}
            className={styles.textarea}
          />
        </label>

        <label className={styles.field}>
          <span className="label-small" style={{ color: "var(--text-secondary)" }}>
            Site identity
          </span>
          <select name="logo_identity" defaultValue={settings.logo_identity} className={styles.input}>
            <option value="business">Business — ConScept</option>
            <option value="personal">Personal — AndreiStanescu</option>
          </select>
          <span className="body-small" style={{ color: "var(--text-tertiary)" }}>
            Choose which identity is shown in the public header and footer. The uploaded logo remains the business logo when selected.
          </span>
        </label>

        <div className={styles.formActions}>
          <button type="submit" className={styles.submit}>
            <span className="label-button">Save settings</span>
          </button>
        </div>
      </form>
    </>
  );
}
