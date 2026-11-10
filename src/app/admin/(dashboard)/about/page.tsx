import { getAllSections } from "@/lib/about";
import { AdminIcon } from "@/components/admin/AdminIcon/AdminIcon";
import { LayoutEditor } from "@/components/admin/LayoutEditor/LayoutEditor";
import { getLayoutConfiguration } from "@/lib/layoutConfiguration";
import { AdminContentTabs } from "@/components/admin/AdminContentTabs/AdminContentTabs";
import { ReorderableList } from "@/components/admin/ReorderableList/ReorderableList";
import { AboutAdminHeader } from "@/components/admin/AboutAdminHeader/AboutAdminHeader";
import { InlineSectionCard } from "@/components/admin/InlineSectionCard/InlineSectionCard";
import { AboutHero } from "@/components/about/AboutHero/AboutHero";
import { AboutDrivesMe } from "@/components/about/AboutDrivesMe/AboutDrivesMe";
import { AboutPhilosophy } from "@/components/about/AboutPhilosophy/AboutPhilosophy";
import { AboutHighlights } from "@/components/about/AboutHighlights/AboutHighlights";
import { AboutLatestInsights } from "@/components/about/AboutLatestInsights/AboutLatestInsights";
import { AboutBeforeConScept } from "@/components/about/AboutBeforeConScept/AboutBeforeConScept";
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
  const previews: Record<string, React.ReactNode> = {
    hero: <AboutHero preview />, drives_me: <AboutDrivesMe />, philosophy: <AboutPhilosophy />,
    highlights: <AboutHighlights />, latest_insights: <AboutLatestInsights />, before_conscept: <AboutBeforeConScept preview />,
  };

  return (
    <>
      <AboutAdminHeader active="/admin/about" />
      <div className={styles.aboutTabContent}>
        <p className={`body-small ${styles.helper}`}>
          Edit section copy and visibility here, and reorder sections by dragging
          or using the arrows. Hero and the closing sections stay in position.
        </p>
        <AdminContentTabs initialTab="sections" tabs={[
        { id: "layout", label: "Layout preview", content: <LayoutEditor page="about" initial={getLayoutConfiguration("about")} previewOnly /> },
        { id: "sections", label: "Section content", content: <>
      <ul className={`${styles.list} ${styles.homepageSectionList}`}>{fixedSections.map((section) => <li key={section.key} className={styles.listItem}><InlineSectionCard section={section} label={LABELS[section.key] ?? section.key} parent="about" preview={previews[section.key]} fixed /></li>)}</ul>

      <ReorderableList
        className={`${styles.list} ${styles.homepageSectionList}`}
        itemClassName={styles.listItem}
        reorderUrl="/api/admin/about/reorder"
        style={{ marginTop: "var(--space-200)" }}
        items={reorderable.map((section, index) => ({
          id: section.key,
          node: (
            <>
              <InlineSectionCard section={section} label={LABELS[section.key] ?? section.key} parent="about" preview={previews[section.key]} reorder={<>
                <form action={`/api/admin/about/${section.key}/move`} method="POST">
                  <input type="hidden" name="direction" value="up" />
                  <button type="submit" disabled={index === 0} aria-label="Move up"><AdminIcon name="direction-arrow-up" /></button>
                </form>
                <form action={`/api/admin/about/${section.key}/move`} method="POST">
                  <input type="hidden" name="direction" value="down" />
                  <button
                    type="submit"
                    disabled={index === reorderable.length - 1}
                    aria-label="Move down"
                  ><AdminIcon name="direction-arrow-down" /></button>
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
