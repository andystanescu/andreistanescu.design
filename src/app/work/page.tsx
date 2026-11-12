import { Nav } from "@/components/Nav/Nav";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer/Footer";
import { RichContent } from "@/components/RichContent/RichContent";
import { LatestInsights } from "@/components/home/LatestInsights/LatestInsights";
import { WorkListing } from "@/components/work/WorkListing/WorkListing";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { getCaseStudies } from "@/data/caseStudies";
import { getPublishedPage } from "@/lib/pages";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { getCategories, getCaseStudyCategoryIds } from "@/lib/categories";
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
  const featured = CASE_STUDIES[0];
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
          <EmptyState eyebrow="Selected work" title="Case studies are on their way" description="Published projects will appear here when they are ready to share." />
        ) : (
          <WorkListing categories={getCategories().map(({ id, name }) => ({ id, name }))} studies={CASE_STUDIES.map((study) => ({
            slug: study.slug, title: study.title, description: study.description,
            thumbnail_image: study.thumbnail_image, category: study.category,
            eyebrow: study.eyebrow, year: study.year, in_progress: study.in_progress,
            password_required: study.password_required, categoryIds: getCaseStudyCategoryIds(study.id),
          }))} />
        )}

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
