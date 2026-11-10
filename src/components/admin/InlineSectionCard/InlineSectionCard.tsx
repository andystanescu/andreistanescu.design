import type { AboutSection } from "@/lib/about";
import type { HomepageSection } from "@/lib/homepage";
import type { ReactNode } from "react";
import adminStyles from "@/app/admin/(dashboard)/admin.module.css";
import { getSettings } from "@/lib/settings";
import { ImageField } from "@/components/admin/ImageField/ImageField";
import { AdminIcon } from "@/components/admin/AdminIcon/AdminIcon";
import styles from "./InlineSectionCard.module.css";
import { SectionLivePreview } from "./SectionLivePreview";

type Props = {
  section: HomepageSection | AboutSection;
  label: string;
  parent: "homepage" | "about";
  fixed?: boolean;
  reorder?: ReactNode;
  preview?: ReactNode;
};

export function InlineSectionCard({ section, label, parent, fixed = false, reorder, preview }: Props) {
  const aboutHero = parent === "about" && section.key === "hero";
  const action = `/api/admin/${parent}/${section.key}`;
  const settings = aboutHero ? getSettings() : null;
  return (
    <div className={styles.card}>
      <details className={styles.details}>
        <summary className={styles.summary}>
          <span><strong className="body-default">{label}</strong>{fixed && <small>fixed position</small>}{!section.visible && <small className={styles.hidden}>hidden from site</small>}</span>
          <span className={styles.summaryActions}>{reorder}<span className={styles.expandIcon} aria-hidden="true"><AdminIcon name="action-plus" className={styles.expandPlus} /><AdminIcon name="action-minus" className={styles.expandMinus} /></span></span>
        </summary>
        <SectionLivePreview sectionKey={section.key} page={parent} preview={preview} photoInline={aboutHero && settings?.logo_identity === "personal"}>
        <form id={`section-${parent}-${section.key}`} className={adminStyles.form} action={action} method="POST" encType={aboutHero ? "multipart/form-data" : undefined}>
          {parent === "about" && ["hero", "latest_insights"].includes(section.key) && <input type="hidden" name="cta_label" defaultValue={(section as AboutSection).cta_label || (section.key === "hero" ? "Download CV" : "See all insights")} />}
          {parent === "homepage" && ["hero", "latest_insights"].includes(section.key) && <input type="hidden" name="cta_primary_label" defaultValue={(section as HomepageSection).cta_primary_label || (section.key === "hero" ? "See my work" : "See all insights")} />}
          {parent === "homepage" && section.key === "hero" && <input type="hidden" name="cta_secondary_label" defaultValue={(section as HomepageSection).cta_secondary_label || "Read articles"} />}
          <label className={adminStyles.field} data-section-copy="eyebrow"><span className="label-small">Eyebrow</span><input name="eyebrow" defaultValue={section.eyebrow} className={adminStyles.input} /></label>
          {aboutHero && settings && settings.logo_identity !== "personal" && <div className={adminStyles.field}>
            <span className="label-small">Personal About image</span>
            <ImageField name="about_hero_image" currentUrl={settings.about_hero_image || undefined} />
            <span className="body-small" style={{ color: "var(--text-tertiary)" }}>Shown beside the copy in Personal mode. If no image is uploaded, the personal logo is used.</span>
          </div>}
          <label className={adminStyles.field} data-section-copy="headline"><span className="label-small">Headline (wrap a word in #like this# for orange)</span><input name="headline" defaultValue={section.headline} required className={adminStyles.input} /></label>
          <label className={adminStyles.field} data-section-copy="description"><span className="label-small">Description</span><textarea name="description" defaultValue={section.description} className={adminStyles.textarea} /></label>
          <label className={adminStyles.checkboxField}><input type="checkbox" name="visible" defaultChecked={!!section.visible} /><span className={adminStyles.switch} /><span className="body-default">Visible on site</span></label>
          <div className={adminStyles.formActions}><a href="" className={adminStyles.tertiaryButton}>Cancel</a><button type="submit" className={adminStyles.submit}><span className="label-button">Save section</span></button></div>
        </form>
        </SectionLivePreview>
      </details>
    </div>
  );
}
