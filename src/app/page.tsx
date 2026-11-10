import { Fragment, type ComponentType } from "react";
import { Nav } from "@/components/Nav/Nav";
import { Hero } from "@/components/home/Hero/Hero";
import { Services } from "@/components/home/Services/Services";
import { Approach } from "@/components/home/Approach/Approach";
import { SelectedImpact } from "@/components/home/SelectedImpact/SelectedImpact";
import { LatestInsights } from "@/components/home/LatestInsights/LatestInsights";
import { Footer } from "@/components/Footer/Footer";
import { getSectionOrder } from "@/lib/homepage";
import styles from "./page.module.css";

// Case studies and insights now come from the database (editable via
// /admin), so this can't be statically generated at build time.
export const dynamic = "force-dynamic";

const SECTION_COMPONENTS: Record<string, ComponentType> = {
  services: Services,
  approach: Approach,
  selected_impact: SelectedImpact,
  latest_insights: LatestInsights,
};

export default function Home() {
  const order = getSectionOrder();
  const groupedSectionKeys = new Set(["services", "approach"]);
  const firstGroupedSectionIndex = order.findIndex((key) => groupedSectionKeys.has(key));

  return (
    <>
      <Nav />
      <div className={styles.heroWrap}>
        <Hero />
        </div>
        <main>
          {order.map((key, index) => {
            if (groupedSectionKeys.has(key)) {
              if (index !== firstGroupedSectionIndex) return null;

              return (
                <Fragment key="services-approach-group">
                    {order.filter((groupKey) => groupedSectionKeys.has(groupKey)).map((groupKey) => {
                      const GroupedSection = SECTION_COMPONENTS[groupKey];
                      return GroupedSection ? <GroupedSection key={groupKey} /> : null;
                    })}
                </Fragment>
              );
            }

            const Section = SECTION_COMPONENTS[key];
            return Section ? (
              <Section key={key} />
            ) : null;
          })}
        </main>
      <Footer />
    </>
  );
}
