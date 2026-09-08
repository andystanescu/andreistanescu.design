import { ArrowIcon } from "@/components/Icon/ArrowIcon";
import { Nav } from "@/components/Nav/Nav";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer/Footer";
import { RichContent } from "@/components/RichContent/RichContent";
import { LatestInsights } from "@/components/home/LatestInsights/LatestInsights";
import { MoreWorkGrid } from "@/components/work/MoreWorkGrid/MoreWorkGrid";
import { FeaturedCaseStudyCard } from "@/components/work/FeaturedCaseStudyCard/FeaturedCaseStudyCard";
import { getCaseStudies } from "@/data/caseStudies";
import { getPublishedPage } from "@/lib/pages";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import styles from "./work.module.css";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const page = getPublishedPage("work");
  return page ? pageMetadata(page, "/work") : {};
}

export default function WorkPage() {
  const page = getPublishedPage("work");
  if (!page) notFound();
  const CASE_STUDIES = getCaseStudies();
  const settings = getSettings();
  const [featured, ...moreStudies] = CASE_STUDIES;
  return (
    <>
      <Nav />
      <main className={`container ${styles.main}`}>
        <p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>
          {page.eyebrow}
        </p>
        <h1 className="display-small">{page.title}</h1>
        <div className={styles.heroDescription}><RichContent html={page.body} /></div>

        {!featured ? (
          <p className="body-default" style={{ color: "var(--text-tertiary)" }}>
            Case studies are on their way — check back soon.
          </p>
        ) : (
          <FeaturedCaseStudyCard slug={featured.slug} title={featured.title} description={featured.description} thumbnail={featured.thumbnail_image} passwordRequired={Boolean(featured.password_required)} category={featured.category} year={featured.year} />
        )}
        <MoreWorkGrid
          totalStudies={CASE_STUDIES.length}
          studies={moreStudies.map((study) => ({
            slug: study.slug,
            eyebrow: study.eyebrow,
            title: study.title,
            description: study.description,
            thumbnail_image: study.thumbnail_image,
            password_required: Boolean(study.password_required),
          }))}
          personal={settings.logo_identity === "personal"}
        />

        <section className={`${styles.outcome} section-dark`} aria-labelledby="work-outcome-title">
          <div className="container">
            <p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>THE OUTCOME</p>
            <div className={styles.outcomeGrid}>
              <h2 id="work-outcome-title" className="heading-02">{settings.work_outcome_title}</h2>
              <p className="body-default" style={{ color: "var(--text-secondary)" }}>{settings.work_outcome_body}</p>
            </div>
          </div>
        </section>
      </main>
      <LatestInsights />
      <Footer />
    </>
  );
}
