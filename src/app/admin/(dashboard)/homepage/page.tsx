import { getAllSections, getSection } from "@/lib/homepage";
import { getSettings } from "@/lib/settings";
import { Hero } from "@/components/home/Hero/Hero";
import { Services } from "@/components/home/Services/Services";
import { Approach } from "@/components/home/Approach/Approach";
import { SelectedImpact } from "@/components/home/SelectedImpact/SelectedImpact";
import { LatestInsights } from "@/components/home/LatestInsights/LatestInsights";
import { LayoutEditor } from "@/components/admin/LayoutEditor/LayoutEditor";
import { getLayoutConfiguration } from "@/lib/layoutConfiguration";
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
  const sections = getAllSections().filter((section) => Object.hasOwn(LABELS, section.key));
  const hero = getSection("hero");
  const settings = getSettings();
  const fixedSections = sections.filter((s) => s.fixed);
  const reorderable = sections.filter((s) => !s.fixed);
  const previews: Record<string, React.ReactNode> = { hero: <Hero />, services: <Services />, approach: <Approach />, selected_impact: <SelectedImpact />, latest_insights: <LatestInsights /> };

  return (
    <>
      <AdminContentTabs header={<div className={`${styles.pageHeader} ${styles.pageHeaderStacked}`}>
        <h1 className="heading-01">Homepage</h1>
        <p className={`body-small ${styles.helper}`}>
          Edit homepage section copy here. Reorder sections by dragging or
          using the arrows, and control visibility in the Sections list.
          Hero stays at the top; the footer stays at the bottom.
        </p>
        <p className={`body-small ${styles.helper}`}>Services and Approach appear together as one scrolling group at the position of whichever comes first in the list. Their order within that group follows the list. Selected Impact and Latest Insights each form a separate scrolling panel.</p>
      </div>} initialTab={tab === "ctas" || tab === "metadata" || tab === "layout" ? tab : "sections"} tabs={[
        { id: "layout", label: "Layout preview", content: <LayoutEditor page="homepage" initial={getLayoutConfiguration("homepage")} previewOnly /> },
        {
          id: "sections",
          label: "Sections",
          content: <>
            <ul className={`${styles.list} ${styles.homepageSectionList}`}>{fixedSections.map((section) => <li key={section.key} className={styles.listItem}><InlineSectionCard section={section} label={LABELS[section.key] ?? section.key} parent="homepage" preview={previews[section.key]} fixed /></li>)}</ul>
            <ReorderableList
              className={`${styles.list} ${styles.homepageSectionList}`}
              itemClassName={styles.listItem}
              reorderUrl="/api/admin/homepage/reorder"
              style={{ marginTop: "var(--space-200)" }}
              items={reorderable.map((section, index) => ({
                id: section.key,
                node: <InlineSectionCard section={section} label={LABELS[section.key] ?? section.key} parent="homepage" preview={previews[section.key]} reorder={<>
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
          label: "Hero buttons",
          content: <section className={styles.panel}>
            <div className={styles.panelHeader}><h2 className="heading-03">Homepage hero buttons</h2><p className="body-small">These labels and destinations control the buttons visitors see on the homepage.</p></div>
            <form className={styles.form} action="/api/admin/homepage-settings" method="POST">
              <input type="hidden" name="return_tab" value="ctas" />
              {hero && <>
                <label className={styles.field}><span className="label-small">Primary button label</span><input name="cta_primary_label" defaultValue={hero.cta_primary_label} className={styles.input} /></label>
                <label className={styles.field}><span className="label-small">Primary button link</span><input name="cta_primary_href" defaultValue={hero.cta_primary_href} className={styles.input} /></label>
                <label className={styles.field}><span className="label-small">Secondary button label</span><input name="cta_secondary_label" defaultValue={hero.cta_secondary_label} className={styles.input} /></label>
                <label className={styles.field}><span className="label-small">Secondary button link</span><input name="cta_secondary_href" defaultValue={hero.cta_secondary_href} className={styles.input} /></label>
              </>}
              <div className={styles.formActions}><a href="/admin/homepage" className={styles.tertiaryButton}>Cancel</a><button type="submit" className={styles.submit}><span className="label-button">Save hero buttons</span></button></div>
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
              <div className={styles.formActions}><a href="/admin/homepage" className={styles.tertiaryButton}>Cancel</a><button type="submit" className={styles.submit}><span className="label-button">Save homepage metadata</span></button></div>
            </form>
          </section>,
        },
      ]} />
    </>
  );
}
