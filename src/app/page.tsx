import type { ComponentType } from "react";
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

  return (
    <>
      <Nav />
      <div className={styles.heroWrap}>
        <Hero />
      </div>
      <main>
        {order.map((key) => {
          const Section = SECTION_COMPONENTS[key];
          return Section ? <Section key={key} /> : null;
        })}
      </main>
      <Footer />
    </>
  );
}
