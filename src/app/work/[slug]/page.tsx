import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { Nav } from "@/components/Nav/Nav";
import { Footer } from "@/components/Footer/Footer";
import { RichContent } from "@/components/RichContent/RichContent";
import { ArticleCard } from "@/components/ArticleCard/ArticleCard";
import { getCaseStudies, getCaseStudyBySlug, getCaseStudyMetrics, getCaseStudyAssessment } from "@/data/caseStudies";
import { assessmentCriteriaList, generateActivityRecommendations, getPrimaryComplexityDrivers } from "@/data/caseStudyAssessment";
import { addHeadingIds } from "@/lib/tableOfContents";
import { TableOfContents } from "@/components/TableOfContents/TableOfContents";
import { BackButton } from "@/components/BackButton/BackButton";
import styles from "./case-study.module.css";
import { CaseStudyLockedContent } from "@/components/CaseStudyPasswordGate/CaseStudyLockedContent";
import { caseStudyAccessCookieName, verifyCaseStudyAccessToken } from "@/lib/caseStudyAccess";
import { contentMetadata, absoluteUrl } from "@/lib/seo";
import { getSettings } from "@/lib/settings";
import { displayDate } from "@/lib/dateUtils";
import { AuthorAvatar } from "@/components/AuthorAvatar/AuthorAvatar";
import { ShareArticle } from "@/components/ShareArticle/ShareArticle";
import headerStyles from "@/app/insights/[slug]/insight.module.css";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { EngagementActivities } from "./EngagementActivities";
import { getRelatedReadingReferences } from "@/lib/interactiveBlocks";
import { RelatedReadingList } from "@/components/RelatedReadingList/RelatedReadingList";

export const dynamic = "force-dynamic";

function ComplexityMetricIcon({ criterion }: { criterion: string }) {
  const paths: Record<string, ReactNode> = {
    discoveryComplexity: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></>,
    organisationalComplexity: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    technicalComplexity: <><path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14" /></>,
    changeComplexity: <><path d="M20 7h-6V1" /><path d="M20 7a9 9 0 1 0 1 8" /></>,
    riskComplexity: <><path d="M12 3 3 7v5c0 5 3.8 8.7 9 10 5.2-1.3 9-5 9-10V7l-9-4Z" /><path d="M12 8v5M12 17h.01" /></>,
    deliveryComplexity: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18M8 16l2 2 5-5" /></>,
  };
  return <svg className={styles.metricIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[criterion]}</svg>;
}

function relatedStudyRank(currentSlug: string, candidateSlug: string) {
  const value = `${currentSlug}:${candidateSlug}`;
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  return hash;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const study = getCaseStudyBySlug(slug);
  if (!study) return {};
  return contentMetadata({ title: study.meta_title || `${study.title} | Andrei Stanescu`, description: study.meta_description || study.description, path: `/work/${encodeURIComponent(study.slug)}`, image: study.og_image || study.thumbnail_image || study.cover_image, keywords: study.meta_keywords, canonicalUrl: study.canonical_url || undefined, noIndex: Boolean(study.password_required) || Boolean(study.no_index) });
}

export default async function CaseStudyDetailPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams?: Promise<{ accessError?: string; preview?: string }> }) {
  const { slug } = await params;
  const query = searchParams ? await searchParams : {};
  const cookieStore = await cookies();
  const preview = query.preview === "1" && verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  const study = getCaseStudyBySlug(slug, preview);
  if (!study) notFound();
  const showInProgress = Boolean(study.in_progress) && !preview;
  const authorName = getSettings().author_name;
  const rawPublishedAt = "published_at" in study && typeof study.published_at === "string" ? study.published_at : "";
  const publishedAt = rawPublishedAt ? displayDate(rawPublishedAt) : "";
  const publicationDetails = [publishedAt, study.year].filter(Boolean).join(" · ");
  let passwordHashes: string[] = [];
  try { const parsed = JSON.parse(study.password_hashes || "[]"); passwordHashes = Array.isArray(parsed) ? parsed.map((value) => typeof value === "string" ? value : value && typeof value === "object" && typeof value.hash === "string" ? value.hash : null).filter((value): value is string => Boolean(value)) : []; } catch { passwordHashes = []; }
  const accessToken = cookieStore.get(caseStudyAccessCookieName(study.slug))?.value;
  const accessGranted = preview || !study.password_required || verifyCaseStudyAccessToken(accessToken, study.slug, passwordHashes);
  const { html: bodyHtml, toc } = addHeadingIds(study.body);
  const relatedReadings = getRelatedReadingReferences(study.body);
  const studies = getCaseStudies();
  const index = studies.findIndex((item) => item.slug === study.slug);
  const previous = index > 0 ? studies[index - 1] : undefined;
  const next = index >= 0 && index < studies.length - 1 ? studies[index + 1] : undefined;
  const related = studies
    .filter((item) => item.slug !== study.slug)
    .sort((left, right) => relatedStudyRank(study.slug, left.slug) - relatedStudyRank(study.slug, right.slug))
    .slice(0, 3);
  const metrics = getCaseStudyMetrics(study);
  const assessment = getCaseStudyAssessment(study);
  const hasAssessment = assessment.overall || assessment.likelyEngagement.length > 0 || Object.values(assessment.scores).some(Boolean);
  const activityRecommendations = generateActivityRecommendations(assessment.scores);
  const applicableEngagement = assessment.likelyEngagement.filter((item) => !assessment.notApplicable.includes(item));
  const likelyRecommendations = applicableEngagement.map((item) => ({ item, recommendation: activityRecommendations.find((activity) => activity.name === item) }));
  const likelyDisplayed = assessmentCriteriaList.flatMap((criterion) => likelyRecommendations
    .filter(({ recommendation }) => recommendation?.triggeredBy[0]?.criterion === criterion.key)
    .slice(0, 2)
    .map(({ item }) => item));
  const likelyAdditional = applicableEngagement.filter((item) => !likelyDisplayed.includes(item));
  const primaryDrivers = getPrimaryComplexityDrivers(assessment.scores);
  const assessmentToc = hasAssessment ? [{ id: "assessment-overview", text: "Assessment" }, { id: "complexity-profile", text: "Complexity profile" }, { id: "likely-engagement", text: "Likely engagement" }] : [];
  const pageToc = [...assessmentToc, ...toc];

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      "@context": "https://schema.org", "@type": "CreativeWork", name: study.title, description: study.description,
      url: absoluteUrl(`/work/${encodeURIComponent(study.slug)}`), image: study.cover_image ? absoluteUrl(study.cover_image) : undefined,
    }) }} />
    <Nav />
    {preview && <aside className={styles.previewBanner}><strong>Preview mode</strong><span>This is the latest saved version and may not be published.</span><Link href={`/admin/case-studies/${study.id}`}>Return to editor</Link></aside>}
    <CaseStudyLockedContent slug={study.slug} locked={!accessGranted} error={query.accessError ? "That password was not recognised." : undefined}>
    <main className={styles.main}>
      <section className={headerStyles.hero}>
        <div className={headerStyles.heroCopy}>
          <BackButton label="Back to work" fallbackHref="/work" />
          <p className={`body-small ${headerStyles.breadcrumb}`}><Link href="/work">Work</Link>{study.category && <> &nbsp;/&nbsp; {study.category}</>}</p>
          <p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>{study.category || study.eyebrow || "CASE STUDY"}</p>
          <h1 className="display-small">{study.title}</h1>
          <p className="body-large" style={{ color: "var(--text-secondary)" }}>{study.description}</p>
          <div className={headerStyles.byline}>
            <p className="body-small" style={{ color: "var(--text-secondary)" }}><AuthorAvatar author={authorName} /></p>
            {publicationDetails && <p className="body-small" style={{ color: "var(--text-tertiary)" }}>{publicationDetails}</p>}
            {study.tags && <p className={headerStyles.tags}>{study.tags}</p>}
          </div>
          <ShareArticle title={study.title} contentType="case_study" contentId={study.slug} />
        </div>
        {/* CMS content may reference uploaded or externally hosted images that are not known at build time. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {study.cover_image && <div className={headerStyles.heroImage}><img src={study.cover_image} alt="" /></div>}
      </section>
      {metrics.length > 0 && <section className={`${styles.outcomes} section-dark`}><div className={`container ${styles.outcomesGrid}`}><div className={styles.outcomeIntro}><p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>{study.outcome_eyebrow || "OUTCOMES"}</p><h2 className={styles.outcomeTitle}>{study.outcome_title}</h2></div><div className={styles.metrics}>{metrics.map((metric) => <div key={`${metric.value}-${metric.label}`} className={styles.metric}><strong>{metric.value}</strong><span>{metric.label}</span></div>)}</div></div></section>}
      {showInProgress && <section className={`container ${styles.inProgress}`}><span className={styles.inProgressBadge}>Write-up in progress</span><h2>The results are in. The story behind them is still being written.</h2><p>This case study is being written up in full—the challenge, the shift in approach, and what was built. The outcomes above are real and already delivered; the full narrative is still being prepared.</p></section>}
      {!showInProgress && <div className={`container ${styles.layout}`}>
        {(pageToc.length > 0 || relatedReadings.length > 0) && <aside className={styles.toc}>{pageToc.length > 0 && <><TableOfContents items={pageToc} /><p className="label-small">ON THIS PAGE</p><nav aria-label="On this page"><ul>{pageToc.map((item) => <li key={item.id}><a href={`#${item.id}`}>{item.text}</a></li>)}</ul></nav></>}<RelatedReadingList items={relatedReadings} /></aside>}
        <article className={styles.articleBody}>{hasAssessment && <section id="engagement-assessment" className={styles.assessment}><div className={styles.assessmentHeader}><div><p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>CONSCEPT ENGAGEMENT ASSESSMENT</p><h2 id="assessment-overview" className="heading-02">A clearer view of the work ahead.</h2><p className="body-default">A practical record of the complexity observed, the activities likely to help, and the work that was actually conducted.</p></div></div><div className={styles.assessmentGrid}><div className={styles.assessmentScores}><h3 id="complexity-profile" className="heading-03">Complexity profile</h3>{assessmentCriteriaList.map((criterion) => { const score=assessment.scores[criterion.key] || 0; return <div className={styles.assessmentScore} key={criterion.key}><ComplexityMetricIcon criterion={criterion.key} /><div className={styles.assessmentScoreMeta}><span>{criterion.label}</span><div className={styles.assessmentScoreValue}><strong>{score ? `${score} / 5` : "—"}</strong>{primaryDrivers.includes(criterion.key) && <em className={styles.primaryDriver}>Primary driver</em>}</div></div><div className={styles.scoreTrack}><i style={{ width: `${Math.min(100, score / 5 * 100)}%` }} /></div></div>; })}</div><div className={styles.assessmentAside}>{assessment.overall && <div className={styles.assessmentSummary}><span>OVERALL COMPLEXITY</span><strong>{assessment.overall}</strong><p>{assessment.overallDescription}</p></div>}<div className={styles.assessmentLists}><div><h3 id="likely-engagement" className="heading-03">Likely engagement</h3><EngagementActivities visibleActivities={likelyDisplayed} additionalActivities={likelyAdditional} conductedActivities={assessment.conducted} /></div></div></div></div></section>}
        <RichContent html={bodyHtml} />
      </article>
      </div>}
      {(previous || next) && <nav className={`container ${styles.caseNav}`} aria-label="Case study navigation">{previous ? <Link href={`/work/${previous.slug}`}><span>Previous case study</span><strong>{previous.title}</strong></Link> : <span />}{next ? <Link href={`/work/${next.slug}`} className={styles.next}><span>Next case study</span><strong>{next.title}</strong></Link> : <span />}</nav>}
      {related.length > 0 && <section className={`container ${styles.related}`}><p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>RELATED WORK</p><h2 className="heading-01">More case studies</h2><div className={styles.relatedGrid}>{related.map((item) => <ArticleCard key={item.slug} slug={item.slug} title={item.title} excerpt={item.description} thumbnail={item.thumbnail_image} variant="caseStudy" />)}</div><Link className={styles.allWork} href="/work">All case studies <span>→</span></Link></section>}
    </main>
    </CaseStudyLockedContent>
    <Footer />
  </>;
}
