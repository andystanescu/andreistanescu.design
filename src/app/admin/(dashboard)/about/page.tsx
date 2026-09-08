import { getAllSections } from "@/lib/about";
import { LayoutEditor } from "@/components/admin/LayoutEditor/LayoutEditor";
import { getLayoutConfiguration } from "@/lib/layoutConfiguration";
import { AdminContentTabs } from "@/components/admin/AdminContentTabs/AdminContentTabs";
import { ReorderableList } from "@/components/admin/ReorderableList/ReorderableList";
import { AboutAdminHeader } from "@/components/admin/AboutAdminHeader/AboutAdminHeader";
import { InlineSectionCard } from "@/components/admin/InlineSectionCard/InlineSectionCard";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

const LABELS: Record<string, string> = {
  hero: "Hero",
  drives_me: "What Drives Me",
  philosophy: "Philosophy",
  highlights: "Highlights",
  latest_insights: "Latest Insights",
  before_conscept: "Before ConScept",
};

export default function AdminAboutPage() {
  const sections = getAllSections();
  const fixedSections = sections.filter((s) => s.fixed);
  const reorderable = sections.filter((s) => !s.fixed);

  return (
    <>
      <AboutAdminHeader active="/admin/about" />
      <div className={styles.aboutTabContent}>
        <p className={`body-small ${styles.helper}`}>
          Nav, Hero, and Footer are always in that position. The sections in
          between can be reordered — drag them, or use the arrows. Philosophy
          and Highlights each have their own item list, in the tabs above. Wrap
          a word in #like this# to color it orange.
        </p>
        <AdminContentTabs initialTab="layout" tabs={[
        { id: "layout", label: "Layout preview", content: <LayoutEditor page="about" initial={getLayoutConfiguration("about")} /> },
        { id: "sections", label: "Section content", content: <>
      <ul className={styles.list}>{fixedSections.map((section) => <li key={section.key} className={styles.listItem}><InlineSectionCard section={section} label={LABELS[section.key] ?? section.key} parent="about" fixed /></li>)}</ul>

      <ReorderableList
        className={styles.list}
        itemClassName={styles.listItem}
        reorderUrl="/api/admin/about/reorder"
        style={{ marginTop: "var(--space-200)" }}
        items={reorderable.map((section, index) => ({
          id: section.key,
          node: (
            <>
              <InlineSectionCard section={section} label={LABELS[section.key] ?? section.key} parent="about" reorder={<>
                <form action={`/api/admin/about/${section.key}/move`} method="POST">
                  <input type="hidden" name="direction" value="up" />
                  <button type="submit" disabled={index === 0} aria-label="Move up">
                    ↑
                  </button>
                </form>
                <form action={`/api/admin/about/${section.key}/move`} method="POST">
                  <input type="hidden" name="direction" value="down" />
                  <button
                    type="submit"
                    disabled={index === reorderable.length - 1}
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                </form>
              </>}/>
            </>
          ),
        }))}
      />
        </> },
        ]} />
      </div>
    </>
  );
}
