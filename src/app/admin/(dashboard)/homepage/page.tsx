import { getAllSections, getSection } from "@/lib/homepage";
import { LayoutEditor } from "@/components/admin/LayoutEditor/LayoutEditor";
import { getLayoutConfiguration } from "@/lib/layoutConfiguration";
import { getSettings } from "@/lib/settings";
import { MetadataFields } from "@/components/admin/MetadataFields/MetadataFields";
import { AdminContentTabs } from "@/components/admin/AdminContentTabs/AdminContentTabs";
import { ReorderableList } from "@/components/admin/ReorderableList/ReorderableList";
import { InlineSectionCard } from "@/components/admin/InlineSectionCard/InlineSectionCard";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

const LABELS: Record<string, string> = {
  hero: "Hero",
  services: "Services",
  approach: "Approach",
  selected_impact: "Selected Impact",
  latest_insights: "Latest Insights",
};

export default async function AdminHomepagePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const sections = getAllSections();
  const hero = getSection("hero");
  const settings = getSettings();
  const fixedSections = sections.filter((s) => s.fixed);
  const reorderable = sections.filter((s) => !s.fixed);

  return (
    <>
      <div className={`${styles.pageHeader} ${styles.pageHeaderStacked}`}>
        <h1 className="heading-01">Homepage</h1>
        <p className={`body-small ${styles.helper}`}>
          Nav, Hero, and Footer are always in that position. The sections in
          between can be reordered — drag them, or use the arrows. Wrap a word
          in #like this# to color it orange.
        </p>
      </div>

      <AdminContentTabs initialTab={tab === "ctas" || tab === "metadata" || tab === "layout" ? tab : "sections"} tabs={[
        { id: "layout", label: "Layout preview", content: <LayoutEditor page="homepage" initial={getLayoutConfiguration("homepage")} /> },
        {
          id: "sections",
          label: "Sections",
          content: <>
            <ul className={styles.list}>{fixedSections.map((section) => <li key={section.key} className={styles.listItem}><InlineSectionCard section={section} label={LABELS[section.key] ?? section.key} parent="homepage" fixed /></li>)}</ul>
            <ReorderableList
              className={styles.list}
              itemClassName={styles.listItem}
              reorderUrl="/api/admin/homepage/reorder"
              style={{ marginTop: "var(--space-200)" }}
              items={reorderable.map((section, index) => ({
                id: section.key,
                node: <InlineSectionCard section={section} label={LABELS[section.key] ?? section.key} parent="homepage" reorder={<>
                  <form action={`/api/admin/homepage/${section.key}/move`} method="POST">
                    <input type="hidden" name="direction" value="up" />
                    <button type="submit" disabled={index === 0} aria-label="Move up">↑</button>
                  </form>
                  <form action={`/api/admin/homepage/${section.key}/move`} method="POST">
                    <input type="hidden" name="direction" value="down" />
                    <button type="submit" disabled={index === reorderable.length - 1} aria-label="Move down">↓</button>
                  </form>
                </>} />,
              }))}
            />
          </>,
        },
        {
          id: "ctas",
          label: "CTAs",
          content: <section className={styles.panel}>
            <div className={styles.panelHeader}><h2 className="heading-03">Homepage CTA labels</h2></div>
            <form className={styles.form} action="/api/admin/homepage-settings" method="POST">
              <input type="hidden" name="return_tab" value="ctas" />
              <label className={styles.field}><span className="label-small">Closing CTA button label</span><input name="homepage_cta_band_label" defaultValue={settings.homepage_cta_band_label} className={styles.input} /></label>
              {hero && <>
                <div className={styles.panelHeader}><h3 className="heading-04">Hero buttons</h3><p className="body-small">These labels and links are used in Business mode. Personal mode uses the fixed “See my work” and “Read articles” labels.</p></div>
                <label className={styles.field}><span className="label-small">Primary button label</span><input name="cta_primary_label" defaultValue={hero.cta_primary_label} className={styles.input} /></label>
                <label className={styles.field}><span className="label-small">Primary button link</span><input name="cta_primary_href" defaultValue={hero.cta_primary_href} className={styles.input} /></label>
                <label className={styles.field}><span className="label-small">Secondary button label</span><input name="cta_secondary_label" defaultValue={hero.cta_secondary_label} className={styles.input} /></label>
                <label className={styles.field}><span className="label-small">Secondary button link</span><input name="cta_secondary_href" defaultValue={hero.cta_secondary_href} className={styles.input} /></label>
              </>}
              <label className={styles.field}><span className="label-small">Case study link label</span><input name="homepage_case_study_link_label" defaultValue={settings.homepage_case_study_link_label} className={styles.input} /></label>
              <label className={styles.field}><span className="label-small">Article link label</span><input name="homepage_article_link_label" defaultValue={settings.homepage_article_link_label} className={styles.input} /></label>
              <label className={styles.field}><span className="label-small">All insights link label</span><input name="homepage_insights_all_label" defaultValue={settings.homepage_insights_all_label} className={styles.input} /></label>
              <div className={styles.formActions}><button type="submit" className={styles.submit}><span className="label-button">Save CTA labels</span></button></div>
            </form>
          </section>,
        },
        {
          id: "metadata",
          label: "Metadata and SEO",
          content: <section className={styles.panel}>
            <div className={styles.panelHeader}><h2 className="heading-03">Homepage metadata and SEO</h2></div>
            <form className={styles.form} action="/api/admin/homepage-settings" method="POST">
              <input type="hidden" name="return_tab" value="metadata" />
              <MetadataFields values={{ meta_title: settings.homepage_meta_title, meta_description: settings.homepage_meta_description, meta_keywords: settings.homepage_meta_keywords, canonical_url: settings.homepage_canonical_url, og_image: settings.homepage_og_image, no_index: settings.homepage_no_index === "1" ? 1 : 0 }} />
              <div className={styles.formActions}><button type="submit" className={styles.submit}><span className="label-button">Save homepage metadata</span></button></div>
            </form>
          </section>,
        },
      ]} />
    </>
  );
}
