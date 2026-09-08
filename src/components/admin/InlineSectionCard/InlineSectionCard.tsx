import type { AboutSection } from "@/lib/about";
import type { HomepageSection } from "@/lib/homepage";
import type { ReactNode } from "react";
import adminStyles from "@/app/admin/(dashboard)/admin.module.css";
import { getSettings } from "@/lib/settings";
import { ImageField } from "@/components/admin/ImageField/ImageField";
import styles from "./InlineSectionCard.module.css";

type Props = {
  section: HomepageSection | AboutSection;
  label: string;
  parent: "homepage" | "about";
  fixed?: boolean;
  reorder?: ReactNode;
};

export function InlineSectionCard({ section, label, parent, fixed = false, reorder }: Props) {
  const homepage = parent === "homepage";
  const aboutHero = parent === "about" && section.key === "hero";
  const action = `/api/admin/${parent}/${section.key}`;
  const settings = aboutHero ? getSettings() : null;
  return (
    <div className={styles.card}>
      <details className={styles.details} open={aboutHero || undefined}>
        <summary className={styles.summary}>
          <span><strong className="body-default">{label}</strong>{fixed && <small>fixed position</small>}{!section.visible && <small className={styles.hidden}>hidden from site</small>}</span>
          <span className={styles.summaryActions}>{reorder}<span className={styles.expandIcon} aria-hidden="true">+</span></span>
        </summary>
        <form className={adminStyles.form} action={action} method="POST" encType={aboutHero ? "multipart/form-data" : undefined}>
          <label className={adminStyles.field}><span className="label-small">Eyebrow</span><input name="eyebrow" defaultValue={section.eyebrow} className={adminStyles.input} /></label>
          {aboutHero && settings && <div className={adminStyles.field}>
            <span className="label-small">Personal About image</span>
            <ImageField name="about_hero_image" currentUrl={settings.about_hero_image || undefined} />
            <span className="body-small" style={{ color: "var(--text-tertiary)" }}>Shown beside the copy in Personal mode. If no image is uploaded, the personal logo is used.</span>
          </div>}
          <label className={adminStyles.field}><span className="label-small">Headline (wrap a word in #like this# for orange)</span><input name="headline" defaultValue={section.headline} required className={adminStyles.input} /></label>
          <label className={adminStyles.field}><span className="label-small">Description</span><textarea name="description" defaultValue={section.description} className={adminStyles.textarea} /></label>
          {homepage && <>
            <input type="hidden" name="cta_primary_label" value={(section as HomepageSection).cta_primary_label} />
            <input type="hidden" name="cta_primary_href" value={(section as HomepageSection).cta_primary_href} />
            <input type="hidden" name="cta_secondary_label" value={(section as HomepageSection).cta_secondary_label} />
            <input type="hidden" name="cta_secondary_href" value={(section as HomepageSection).cta_secondary_href} />
          </>}
          <label className={adminStyles.checkboxField}><input type="checkbox" name="visible" defaultChecked={!!section.visible} /><span className={adminStyles.switch} /><span className="body-default">Visible on site</span></label>
          <button type="submit" className={adminStyles.submit}><span className="label-button">Save section</span></button>
        </form>
      </details>
    </div>
  );
}
