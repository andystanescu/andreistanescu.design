import type { Page } from "@/lib/pages";
import { RichTextEditor } from "@/components/admin/RichTextEditor/RichTextEditor";
import { getSettings } from "@/lib/settings";
import styles from "@/app/admin/(dashboard)/admin.module.css";
import { MetadataFields } from "@/components/admin/MetadataFields/MetadataFields";
import { AdminContentTabs } from "@/components/admin/AdminContentTabs/AdminContentTabs";

type PageSettingsFormProps = {
  page: Page;
  error?: string;
  /** Where to send the admin back to after saving — the section's own
   * settings tab, not the generic /admin/pages list (see redirect handling
   * in /api/admin/pages/[slug]). */
  redirect: string;
  /** Shown above the form — e.g. a note that eyebrow/title/body aren't
   * rendered on this particular public page, only the nav label is. */
  note?: string;
};

// The eyebrow/title/nav-label/show-in-nav/body controls for a `pages` row
// that has its own dedicated admin section (Services, Approach, Case
// studies, Insights, About) — embedded as that section's "Page settings"
// tab instead of the generic /admin/pages list.
export function PageSettingsForm({ page, error, redirect, note }: PageSettingsFormProps) {
  const settings = page.slug === "work" || page.slug === "approach" ? getSettings() : null;
  return (
    <>
      {note && (
        <p className={`body-small ${styles.helper}`}>
          {note}
        </p>
      )}
      {error && <p style={{ color: "var(--border-error)" }}>{error}</p>}
      <form className={styles.form} action={`/api/admin/pages/${page.slug}`} method="POST">
        <input type="hidden" name="redirect" value={redirect} />

        <AdminContentTabs tabs={[
          { id: "details", label: "Details", content: <div className={styles.formSection}>

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

        {settings && (
          <>
            {page.slug === "work" ? <>
            <label className={styles.field}>
              <span className="label-small" style={{ color: "var(--text-secondary)" }}>Outcome title</span>
              <input name="work_outcome_title" defaultValue={settings.work_outcome_title} className={styles.input} />
            </label>
            <label className={styles.field}>
              <span className="label-small" style={{ color: "var(--text-secondary)" }}>Outcome description</span>
              <textarea name="work_outcome_body" defaultValue={settings.work_outcome_body} className={styles.textarea} />
            </label>
            </> : <>
              <p className="heading-02">Approach page content</p>
              <label className={styles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>Principle eyebrow</span><input name="approach_principle_eyebrow" defaultValue={settings.approach_principle_eyebrow} className={styles.input} /></label>
              <label className={styles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>Principle title</span><input name="approach_principle_title" defaultValue={settings.approach_principle_title} className={styles.input} /></label>
              <label className={styles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>Principle description</span><textarea name="approach_principle_body" defaultValue={settings.approach_principle_body} className={styles.textarea} /></label>
              <label className={styles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>How I work eyebrow</span><input name="approach_how_eyebrow" defaultValue={settings.approach_how_eyebrow} className={styles.input} /></label>
              <label className={styles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>How I work title</span><input name="approach_how_title" defaultValue={settings.approach_how_title} className={styles.input} /></label>
              <label className={styles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>Leave behind eyebrow</span><input name="approach_leave_eyebrow" defaultValue={settings.approach_leave_eyebrow} className={styles.input} /></label>
              <label className={styles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>Leave behind card 1 title</span><input name="approach_leave_one_title" defaultValue={settings.approach_leave_one_title} className={styles.input} /></label>
              <label className={styles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>Leave behind card 1 description</span><textarea name="approach_leave_one_body" defaultValue={settings.approach_leave_one_body} className={styles.textarea} /></label>
              <label className={styles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>Leave behind card 2 title</span><input name="approach_leave_two_title" defaultValue={settings.approach_leave_two_title} className={styles.input} /></label>
              <label className={styles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>Leave behind card 2 description</span><textarea name="approach_leave_two_body" defaultValue={settings.approach_leave_two_body} className={styles.textarea} /></label>
              <label className={styles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>Leave behind card 3 title</span><input name="approach_leave_three_title" defaultValue={settings.approach_leave_three_title} className={styles.input} /></label>
              <label className={styles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>Leave behind card 3 description</span><textarea name="approach_leave_three_body" defaultValue={settings.approach_leave_three_body} className={styles.textarea} /></label>
              <label className={styles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>Shared way title</span><input name="approach_shared_title" defaultValue={settings.approach_shared_title} className={styles.input} /></label>
              <label className={styles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>Shared way description</span><textarea name="approach_shared_body" defaultValue={settings.approach_shared_body} className={styles.textarea} /></label>
              <label className={styles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>Leadership card title</span><input name="approach_audience_leadership_title" defaultValue={settings.approach_audience_leadership_title} className={styles.input} /></label>
              <label className={styles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>Leadership card description</span><textarea name="approach_audience_leadership_body" defaultValue={settings.approach_audience_leadership_body} className={styles.textarea} /></label>
              <label className={styles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>Product card title</span><input name="approach_audience_product_title" defaultValue={settings.approach_audience_product_title} className={styles.input} /></label>
              <label className={styles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>Product card description</span><textarea name="approach_audience_product_body" defaultValue={settings.approach_audience_product_body} className={styles.textarea} /></label>
              <label className={styles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>Organisation card title</span><input name="approach_audience_org_title" defaultValue={settings.approach_audience_org_title} className={styles.input} /></label>
              <label className={styles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>Organisation card description</span><textarea name="approach_audience_org_body" defaultValue={settings.approach_audience_org_body} className={styles.textarea} /></label>
            </>}
          </>
        )}

        </div> },
          { id: "metadata", label: "Metadata and SEO", content: <div className={styles.field}><span className="label-eyebrow">Metadata and SEO</span><MetadataFields values={page} /></div> },
        ]} />

        <div className={styles.formActions}>
          <button type="submit" className={styles.submit}>
            <span className="label-button">Save changes</span>
          </button>
        </div>
      </form>
    </>
  );
}
