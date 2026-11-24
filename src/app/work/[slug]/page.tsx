import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Nav } from "@/components/Nav/Nav";
import { Footer } from "@/components/Footer/Footer";
import { RichContent } from "@/components/RichContent/RichContent";
import { ArticleCard } from "@/components/ArticleCard/ArticleCard";
import { getCaseStudies, getCaseStudyBySlug, getCaseStudyMetrics, getCaseStudyAssessment } from "@/data/caseStudies";
import { assessmentCriteriaList, getAssessmentActivityCategories } from "@/data/caseStudyAssessment";
import { addHeadingIds } from "@/lib/tableOfContents";
import { TableOfContents } from "@/components/TableOfContents/TableOfContents";
import styles from "./case-study.module.css";
import { CaseStudyPasswordGate } from "@/components/CaseStudyPasswordGate/CaseStudyPasswordGate";
import { ContentViewTracker } from "@/components/ContentViewTracker/ContentViewTracker";
import { caseStudyAccessCookieName, verifyCaseStudyAccessToken } from "@/lib/caseStudyAccess";
import { contentMetadata, absoluteUrl } from "@/lib/seo";
import { getSettings } from "@/lib/settings";
import { displayDate } from "@/lib/dateUtils";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { EngagementActivities } from "./EngagementActivities";
import { getRelatedReadingReferences } from "@/lib/interactiveBlocks";
import { RelatedReadingList } from "@/components/RelatedReadingList/RelatedReadingList";
import { resolveRelatedReadings } from "@/lib/relatedReadings";
import { CaseStudyHero } from "@/components/work/CaseStudyHero/CaseStudyHero";
import { AssessmentDisclosure } from "./AssessmentDisclosure";
import { CaseStudyOverview } from "@/components/work/CaseStudyOverview/CaseStudyOverview";
import { canShowCaseStudyOverview, parseCaseStudyOverview } from "@/lib/caseStudyOverview";
import { displayedHeroVisualCode } from "@/lib/heroVisual";
import { hasEditorAssessmentPlacement, splitAssessmentBlock } from "@/lib/assessmentPlacement";

export const dynamic = "force-dynamic";

function relatedStudyRank(currentSlug: string, candidateSlug: string) {
  const value = `${currentSlug}:${candidateSlug}`;
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  return hash;
}

function splitHtmlAfterHeading(html: string, headingId: string) {
  const escapedId = headingId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const headingPattern = new RegExp(`<h[23]\\b(?=[^>]*\\bid="${escapedId}")[^>]*>[\\s\\S]*?<\\/h[23]>`, "i");
  const match = headingPattern.exec(html);
  if (!match || match.index === undefined) return null;
  const splitAt = match.index + match[0].length;
  return { before: html.slice(0, splitAt), after: html.slice(splitAt) };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const study = getCaseStudyBySlug(slug);
  if (!study) return {};
  const defaults = getSettings();
  return contentMetadata({ title: study.meta_title || defaults.site_meta_title, description: study.meta_description || defaults.site_meta_description, path: `/work/${encodeURIComponent(study.slug)}`, image: study.og_image || study.thumbnail_image || study.cover_image, keywords: study.meta_keywords, canonicalUrl: study.canonical_url || undefined, noIndex: Boolean(study.password_required) || Boolean(study.no_index) });
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
  const overview = parseCaseStudyOverview(study.overview);
  const renderedBody = accessGranted ? (preview && study.body_draft !== null ? study.body_draft : study.body) : "";
  const { html: bodyHtml, toc } = addHeadingIds(renderedBody);
  const relatedReadings = resolveRelatedReadings(getRelatedReadingReferences(renderedBody));
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
  const activityCategories = getAssessmentActivityCategories(assessment);
  const hasAssessment = Boolean(assessment.overall || activityCategories.some((category) => category.activities.some((activity) => activity.title.trim())) || Object.values(assessment.scores).some(Boolean));
  const editorSplit = splitAssessmentBlock(bodyHtml);
  const legacyPlacement = !hasEditorAssessmentPlacement(renderedBody) && !editorSplit;
  const legacySplit = legacyPlacement && hasAssessment && assessment.placement !== "start" ? splitHtmlAfterHeading(bodyHtml, assessment.placement) : null;
  const assessmentSplit = editorSplit ?? legacySplit;
  const showAssessment = hasAssessment && Boolean(editorSplit || legacyPlacement);
  const assessmentPlacementIndex = editorSplit ? addHeadingIds(editorSplit.before).toc.length - 1 : legacySplit ? toc.findIndex((item) => item.id === assessment.placement) : -1;
  const pageToc = [...toc];
  if (showAssessment) pageToc.splice(assessmentPlacementIndex >= 0 ? assessmentPlacementIndex + 1 : 0, 0, { id: "assessment-overview", text: "Assessment" });
  const assessmentBlock = showAssessment ? <AssessmentDisclosure overall={assessment.overall} interpretation={assessment.overallDescription} dimensions={assessmentCriteriaList.map((criterion) => ({ label: criterion.label, score: assessment.scores[criterion.key] || 0 }))}><section id="engagement-assessment" className={styles.assessment}><h3 id="engagement-activities" className="heading-03">Engagement activities</h3><EngagementActivities categories={activityCategories} /></section></AssessmentDisclosure> : null;

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      "@context": "https://schema.org", "@type": "CreativeWork", name: study.title, description: study.description,
      url: absoluteUrl(`/work/${encodeURIComponent(study.slug)}`), image: study.cover_image ? absoluteUrl(study.cover_image) : undefined,
    }) }} />
    <Nav />
    {preview && <aside className={styles.previewBanner}><strong>Preview mode</strong><span>{study.body_draft !== null ? "Showing the saved body draft." : "Showing the current published body."}</span><Link href={`/admin/case-studies/${study.id}`}>Return to editor</Link></aside>}
    <ContentViewTracker contentType="case_study" contentId={study.slug} />
    <main className={styles.main}>
      <CaseStudyHero slug={study.slug} category={study.category} company={study.eyebrow} title={study.title} summary={study.description} author={authorName} publicationDetails={publicationDetails} tags={study.tags} role={study.project_role} contribution={study.contribution} timeline={study.timeline} scope={study.scope} team={study.team} coverImage={study.cover_image} heroCode={displayedHeroVisualCode(study.hero_code, study.hero_code_draft, Boolean(preview))} impactEyebrow={study.outcome_eyebrow || "Impact"} impactTitle={study.outcome_title} metrics={metrics} />
      {canShowCaseStudyOverview(overview, accessGranted) && <CaseStudyOverview overview={overview} target={showInProgress || accessGranted ? "case-study-story" : "protected-story-title"} followsOutcomes={metrics.length > 0} />}
      {showInProgress && <section id="case-study-story" className={`container ${styles.inProgress}`}><span className={styles.inProgressBadge}>Write-up in progress</span><h2>The results are in. The story behind them is still being written.</h2><p>This case study is being written up in full—the challenge, the shift in approach, and what was built. The outcomes above are real and already delivered; the full narrative is still being prepared.</p></section>}
      {!showInProgress && !accessGranted && <CaseStudyPasswordGate slug={study.slug} error={query.accessError ? "That password was not recognised." : undefined} />}
      {!showInProgress && accessGranted && <div className={`container ${styles.layout}`}>
        {(pageToc.length > 0 || relatedReadings.length > 0) && <aside className={styles.toc}><TableOfContents items={pageToc} relatedReadings={relatedReadings} /><RelatedReadingList items={relatedReadings} desktopOnly /></aside>}
        <article id="case-study-story" className={styles.articleBody}>{assessmentBlock && !assessmentSplit && assessmentBlock}{assessmentSplit ? <><RichContent html={assessmentSplit.before} />{assessmentBlock}<RichContent html={assessmentSplit.after} /></> : <RichContent html={bodyHtml} />}
      </article>
      </div>}
      {(previous || next) && <nav className={`container ${styles.caseNav}`} aria-label="Case study navigation">{previous ? <Link href={`/work/${previous.slug}`}><span>Previous case study</span><strong>{previous.title}</strong></Link> : <span />}{next ? <Link href={`/work/${next.slug}`} className={styles.next}><span>Next case study</span><strong>{next.title}</strong></Link> : <span />}</nav>}
      {related.length > 0 && <section className={`container ${styles.related}`}><p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>RELATED WORK</p><h2 className="heading-01">More case studies</h2><div className={styles.relatedGrid}>{related.map((item) => <ArticleCard key={item.slug} slug={item.slug} title={item.title} excerpt={item.description} thumbnail={item.thumbnail_image || item.cover_image} heroCode={item.hero_code} variant="caseStudy" />)}</div><Link className={styles.allWork} href="/work">All case studies <span>→</span></Link></section>}
    </main>
    <Footer variant="compact" />
  </>;
}
