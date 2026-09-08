import type { ComponentType } from "react";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav/Nav";
import { Footer } from "@/components/Footer/Footer";
import { AboutHero } from "@/components/about/AboutHero/AboutHero";
import { AboutDrivesMe } from "@/components/about/AboutDrivesMe/AboutDrivesMe";
import { AboutPhilosophy } from "@/components/about/AboutPhilosophy/AboutPhilosophy";
import { AboutHighlights } from "@/components/about/AboutHighlights/AboutHighlights";
import { AboutLatestInsights } from "@/components/about/AboutLatestInsights/AboutLatestInsights";
import { AboutHowIWork } from "@/components/about/AboutHowIWork/AboutHowIWork";
import { AboutBeforeConScept } from "@/components/about/AboutBeforeConScept/AboutBeforeConScept";
import { getSectionOrder } from "@/lib/about";
import { getPublishedPage } from "@/lib/pages";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

// Content (sections, philosophy/highlight items, latest article) comes
// from the database — this can't be statically generated at build time.
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const page = getPublishedPage("about");
  return page ? pageMetadata(page, "/about") : {};
}

const SECTION_COMPONENTS: Record<string, ComponentType> = {
  drives_me: AboutDrivesMe,
  philosophy: AboutPhilosophy,
  highlights: AboutHighlights,
  latest_insights: AboutLatestInsights,
  before_conscept: AboutBeforeConScept,
};

export default function AboutPage() {
  if (!getPublishedPage("about")) notFound();
  const order = getSectionOrder();

  return (
    <>
      <Nav />
      <AboutHero />
      <main>
        {order.map((key) => {
          const Section = SECTION_COMPONENTS[key];
          return Section ? <Section key={key} /> : null;
        })}
        <AboutHowIWork />
      </main>
      <Footer />
    </>
  );
}
