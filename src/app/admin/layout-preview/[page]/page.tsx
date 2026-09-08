import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLayoutPage } from "@/lib/layoutDraft";
import { getLayoutConfiguration } from "@/lib/layoutConfiguration";
import { PreviewCanvas } from "@/components/admin/LayoutEditor/PreviewCanvas";
import { Nav } from "@/components/Nav/Nav";
import { Footer } from "@/components/Footer/Footer";
import { Hero } from "@/components/home/Hero/Hero";
import { Services } from "@/components/home/Services/Services";
import { Approach } from "@/components/home/Approach/Approach";
import { SelectedImpact } from "@/components/home/SelectedImpact/SelectedImpact";
import { LatestInsights } from "@/components/home/LatestInsights/LatestInsights";
import { AboutHero } from "@/components/about/AboutHero/AboutHero";
import { AboutDrivesMe } from "@/components/about/AboutDrivesMe/AboutDrivesMe";
import { AboutPhilosophy } from "@/components/about/AboutPhilosophy/AboutPhilosophy";
import { AboutHighlights } from "@/components/about/AboutHighlights/AboutHighlights";
import { AboutLatestInsights } from "@/components/about/AboutLatestInsights/AboutLatestInsights";
import { AboutBeforeConScept } from "@/components/about/AboutBeforeConScept/AboutBeforeConScept";
import { AboutHowIWork } from "@/components/about/AboutHowIWork/AboutHowIWork";
import homeStyles from "@/app/page.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Layout preview", robots: { index: false, follow: false } };

export default async function LayoutPreview({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  if (!isLayoutPage(page)) notFound();
  const { sections } = getLayoutConfiguration(page);
  const slots = page === "homepage" ? [
    { key: "services", content: <Services /> }, { key: "approach", content: <Approach /> },
    { key: "selected_impact", content: <SelectedImpact /> }, { key: "latest_insights", content: <LatestInsights /> },
  ] : [
    { key: "drives_me", content: <AboutDrivesMe /> }, { key: "philosophy", content: <AboutPhilosophy /> },
    { key: "highlights", content: <AboutHighlights /> }, { key: "latest_insights", content: <AboutLatestInsights /> },
    { key: "before_conscept", content: <AboutBeforeConScept preview /> },
  ];
  return <PreviewCanvas page={page} initial={sections} slots={slots.filter((slot) => sections.some((section) => section.key === slot.key))}
    hero={page === "homepage" ? <div className={homeStyles.heroWrap}><Hero /></div> : <AboutHero />}
    closing={page === "about" ? <AboutHowIWork /> : undefined} navigation={<Nav />} footer={<Footer />} />;
}
