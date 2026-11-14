import Link from "next/link";
import { db } from "@/lib/db";
import { listSubmissions } from "@/lib/submissions";
import { DashboardGreeting } from "@/components/admin/DashboardGreeting/DashboardGreeting";
import { EngagementOverview } from "@/components/admin/EngagementOverview/EngagementOverview";
import { ContentPerformance } from "@/components/admin/ContentPerformance/ContentPerformance";
import { VisitorJourneys } from "@/components/admin/VisitorJourneys/VisitorJourneys";
import { readContentPerformance } from "@/lib/contentPerformance";
import { readEngagementOverview } from "@/lib/engagementOverview";
import { getEngagementDashboardData, type EngagementRange } from "@/lib/analytics";
import { ukDateTimeValue } from "@/lib/dateUtils";
import styles from "./dashboard-home.module.css";

export const dynamic = "force-dynamic";

export default async function AdminHomePage({ searchParams }: { searchParams?: Promise<{ range?: string; contentType?: string | string[]; contentPage?: string | string[]; journeyPage?: string | string[] }> }) {
  const query = searchParams ? await searchParams : {};
  const rawRange = Array.isArray(query.range) ? query.range[0] : query.range;
  const range: EngagementRange = ["7d", "30d", "90d", "all"].includes(rawRange || "") ? rawRange as EngagementRange : "30d";
  const engagement = getEngagementDashboardData(range, { contentPage: parsePageNumber(query.contentPage), journeyPage: parsePageNumber(query.journeyPage) });
  const overview = readEngagementOverview(db, range);
  const contentPerformance = readContentPerformance(db, range, { group: Array.isArray(query.contentType) ? query.contentType[0] : query.contentType, page: parsePageNumber(query.contentPage) });
  const periodLabel = range === "all" ? "All time" : `Last ${range.slice(0, -1)} days`;
  const trackingStartLabel = engagement.trackingStart
    ? new Date(`${engagement.trackingStart.replace(" ", "T")}Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "Not started";
  const earlySample = overview.current.sessions < 20;
  const caseStudies = db.prepare("SELECT id, slug, title, description, body, tags, thumbnail_image, cover_image, published, body_draft_enabled, meta_title, meta_description, canonical_url, og_image FROM case_studies ORDER BY id DESC").all() as Array<{ id: number; slug: string; title: string; description: string; body: string; tags: string; thumbnail_image: string; cover_image: string; published: number; body_draft_enabled: number; meta_title: string; meta_description: string; canonical_url: string; og_image: string }>;
  const caseStudiesBySlug = new Map(caseStudies.map((caseStudy) => [caseStudy.slug, caseStudy]));
  const insights = db.prepare("SELECT id, slug, title, excerpt, body, tags, thumbnail_image, cover_image, published, scheduled_at, meta_title, meta_description, canonical_url, og_image FROM insights ORDER BY id DESC").all() as Array<{ id: number; slug: string; title: string; excerpt: string; body: string; tags: string; thumbnail_image: string; cover_image: string; published: number; scheduled_at: string; meta_title: string; meta_description: string; canonical_url: string; og_image: string }>;
  const services = db.prepare("SELECT slug, title FROM service_items").all() as Array<{ slug: string; title: string }>;
  const contentTitles = Object.fromEntries([...caseStudies.map((item) => [`/work/${item.slug}`, item.title]), ...insights.map((item) => [`/insights/${item.slug}`, item.title]), ...services.map((item) => [`/services/${item.slug}`, item.title])]);
  const contentEditLinks = Object.fromEntries([...caseStudies.map((item) => [`/work/${item.slug}`, `/admin/case-studies/${item.id}`]), ...insights.map((item) => [`/insights/${item.slug}`, `/admin/insights/${item.id}`])]);
  const submissions = listSubmissions();
  const recentSubmissions = submissions.slice(0, 5);
  const olderSubmissions = submissions.slice(5);
  const publishedCaseStudies = caseStudies.filter((item) => item.published).length;
  const publishedArticles = insights.filter((item) => item.published).length;
  const draftCaseStudies = caseStudies.filter((item) => !item.published).length;
  const draftArticles = insights.filter((item) => !item.published).length;
  const now = ukDateTimeValue();
  const contentChecks: Array<{ label: string; detail: string; href: string; group: "Publishing" | "Essentials" | "Metadata" }> = [];
  for (const item of caseStudies) {
    const href = `/admin/case-studies/${item.id}`;
    const title = item.title.trim() || `Case study ${item.id}`;
    if (!item.published) contentChecks.push({ label: title, detail: "Draft · review and publish when ready", href, group: "Publishing" });
    if (item.body_draft_enabled) contentChecks.push({ label: title, detail: "Unpublished body draft · review before publishing", href, group: "Publishing" });
    if (!item.title.trim()) contentChecks.push({ label: title, detail: "Missing title", href, group: "Essentials" });
    if (!item.slug.trim() || !isValidSlug(item.slug)) contentChecks.push({ label: title, detail: "Missing or invalid page slug", href, group: "Essentials" });
    if (!item.description.trim()) contentChecks.push({ label: title, detail: "Missing summary", href, group: "Essentials" });
    if (!stripMarkup(item.body)) contentChecks.push({ label: title, detail: "Missing case-study content", href, group: "Essentials" });
    if (!item.thumbnail_image.trim()) contentChecks.push({ label: title, detail: "Missing thumbnail image", href, group: "Essentials" });
    if (!item.tags.trim()) contentChecks.push({ label: title, detail: "No service or topic tags", href, group: "Essentials" });
    contentChecks.push(...metadataIssues({ title: item.title, metaTitle: item.meta_title, metaDescription: item.meta_description, sourceDescription: item.description, canonicalUrl: item.canonical_url, ogImage: item.og_image, thumbnail: item.thumbnail_image, cover: item.cover_image }).map((detail) => ({ label: title, detail, href, group: "Metadata" as const })));
  }
  for (const item of insights) {
    const href = `/admin/insights/${item.id}`;
    const title = item.title.trim() || `Article ${item.id}`;
    if (!item.published) contentChecks.push({ label: title, detail: "Draft · review and publish when ready", href, group: "Publishing" });
    else if (item.scheduled_at && new Date(item.scheduled_at) > new Date(now)) contentChecks.push({ label: title, detail: `Scheduled · publishes ${item.scheduled_at.replace("T", " ")} UK time`, href, group: "Publishing" });
    if (!item.title.trim()) contentChecks.push({ label: title, detail: "Missing title", href, group: "Essentials" });
    if (!item.slug.trim() || !isValidSlug(item.slug)) contentChecks.push({ label: title, detail: "Missing or invalid page slug", href, group: "Essentials" });
    if (!item.excerpt.trim()) contentChecks.push({ label: title, detail: "Missing excerpt", href, group: "Essentials" });
    if (!stripMarkup(item.body)) contentChecks.push({ label: title, detail: "Missing article content", href, group: "Essentials" });
    if (!item.thumbnail_image.trim()) contentChecks.push({ label: title, detail: "Missing thumbnail image", href, group: "Essentials" });
    if (!item.tags.trim()) contentChecks.push({ label: title, detail: "No article tags", href, group: "Essentials" });
    contentChecks.push(...metadataIssues({ title: item.title, metaTitle: item.meta_title, metaDescription: item.meta_description, sourceDescription: item.excerpt, canonicalUrl: item.canonical_url, ogImage: item.og_image, thumbnail: item.thumbnail_image, cover: item.cover_image }).map((detail) => ({ label: title, detail, href, group: "Metadata" as const })));
  }
  const visibleContentChecks = contentChecks.slice(0, 5);
  const remainingContentChecks = contentChecks.slice(5);

  return <div className={styles.dashboard}>
    <div className={styles.header}>
      <div><p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>Content control centre</p><DashboardGreeting /></div>
      <div className={styles.headerCoverage} aria-label="Engagement data coverage">
        <div className={styles.headerCoverageItem}><span>Engagement period</span><strong>{periodLabel}</strong></div>
        <div className={styles.headerCoverageItem}><span>First tracked session</span><strong>{trackingStartLabel}</strong></div>
        <div className={`${styles.headerCoverageItem} ${earlySample ? styles.headerSampleEarly : styles.headerSampleReady}`}><span>Engagement sample</span><strong>{earlySample ? `Early · ${overview.current.sessions} likely-human sessions` : `${overview.current.sessions} likely-human sessions`}</strong></div>
      </div>
    </div>
    <section className={styles.engagementPanel} aria-labelledby="engagement-overview">
      <nav className={styles.rangeTabs} aria-label="Engagement date range">{(["7d", "30d", "90d", "all"] as EngagementRange[]).map((value) => <Link key={value} href={value === "30d" ? "/admin" : `/admin?range=${value}`} aria-current={range === value ? "page" : undefined} className={range === value ? styles.rangeActive : undefined}>{value === "all" ? "All time" : `Last ${value.slice(0, -1)} days`}</Link>)}</nav>
      <p className={styles.coverageNote}>This range applies to engagement, content signals, chapter progression and journeys. Published and draft counts are all-time totals.</p>
      <EngagementOverview data={overview} range={range} />
      <details className={styles.countingDetails}>
        <summary>How this is counted</summary>
        <div className={styles.countingContent}>
          <p><strong>Sessions.</strong> A session is a single browser tab, not an identified person. The overview includes only sessions classified as likely human; the detailed reports below also include uncertain sessions. Of the sessions in this range, {engagement.counts.uncertain} remain uncertain and {engagement.counts.likelyBot + engagement.counts.verifiedBot} are classified as automation ({engagement.counts.verifiedBot} verified, {engagement.counts.likelyBot} likely). Classification is a best-effort estimate, not identity verification.</p>
          <p><strong>Enquiries.</strong> Counts include non-blocked contact submissions received during the selected period, whether or not the email notification was delivered. New submissions can be associated with a tab session when tracking is available; this does not establish which page caused the enquiry. Previously blocked submissions that were manually unblocked are included.</p>
          <p><strong>Comparisons.</strong> Where shown, the percentage compares counts with the preceding period of equal length. Comparisons require at least 20 likely-human sessions in both periods, at least 20 in both metric counts, the same measurement rules across both periods, and an earliest recorded session before the comparison period. This does not guarantee uninterrupted tracking.</p>
          <p><strong>Engagement levels.</strong> New sessions require attentive activity or a meaningful action for exploration; page count and scroll alone do not qualify. Engaged and deep levels combine attentive time with page-type-specific signals. Older sessions retain their original classifications, which used different exploration rules. These levels indicate evidence, not proof that all content was read.</p>
          <p><strong>Attention and scroll.</strong> Attentive active time accrues while a tab is visible and focused after recent user input. Scroll reach is the deepest page position recorded; 100% means the page end was reached, not that it was fully consumed.</p>
          <p><strong>Journeys and portfolio exploration.</strong> Journey elapsed time spans the first to last recorded event and can include inactive gaps; attentive active time sums the page measurements. {engagement.counts.portfolioExplorers} sessions in this range visited three or more content types (portfolio explorers).</p>
          <p><strong>Coverage.</strong> {engagement.trackingStart ? `Engagement tracking has data since ${new Date(`${engagement.trackingStart.replace(" ", "T")}Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}; older visits have no attention or depth data.` : "No engagement sessions are available yet. New metrics begin after tracking is deployed; older visits have no attention or depth data."} Browser-side tracking cannot observe crawlers that do not run site scripts.</p>
        </div>
      </details>
    </section>
    <ContentPerformance data={contentPerformance} range={range} titles={contentTitles} editLinks={contentEditLinks} journeyPage={engagement.journeyPage} />
    {engagement.chapters.length > 0 && <section className={styles.panel} aria-labelledby="chapter-depth"><div className={styles.panelHeader}><h2 id="chapter-depth" className="heading-03">Case-study chapter progression</h2><span className={styles.panelNote}>Distinct likely-human + uncertain sessions reaching each chapter</span></div><div className={styles.chapterGrid}>{engagement.chapters.map((chapter) => { const caseStudy = caseStudiesBySlug.get(chapter.content_id); return <div className={styles.chapterRow} key={`${chapter.content_id}-${chapter.detail}`}><div className={styles.chapterInfo}><span>{chapter.detail}</span>{caseStudy ? <Link href={`/admin/case-studies/${caseStudy.id}`} className={styles.chapterTitle}>{caseStudy.title}</Link> : <span className={styles.chapterTitle}>Case study unavailable</span>}</div><strong>{chapter.count}</strong></div>;})}</div></section>}
    <VisitorJourneys journeys={engagement.journeys} total={engagement.journeyTotal} page={engagement.journeyPage} pageSize={engagement.journeyPageSize} range={range} contentType={contentPerformance.selectedGroup} contentPage={contentPerformance.page} titles={contentTitles} />
    <section className={`${styles.panel} ${styles.actionQueue}`} aria-labelledby="action-queue">
      <div className={styles.panelHeader}><h2 id="action-queue" className="heading-03">Needs attention</h2><span className={styles.panelNote}>Publishing, content quality, metadata and incoming submissions</span></div>
      <div className={styles.actionQueueGrid}>
        <div className={styles.actionQueueColumn}>
          <div className={styles.queueColumnHeader}><h3 className="heading-04">Content to review</h3><span className="label-small">{contentChecks.length}</span></div>
          <p className={styles.coverageNote}>Drafts and scheduled articles, missing essentials, and metadata that needs correction.</p>
          {contentChecks.length ? <>
            {visibleContentChecks.map((item, index) => <Link key={`${item.href}-${item.group}-${item.detail}-${index}`} href={item.href} className={styles.attentionRow}><span className={styles.alert} aria-hidden="true">!</span><span><strong>{item.label}</strong><small className={styles.attentionDetail}>{item.group} · {item.detail}</small></span><span className={styles.attentionAction}>Fix →</span></Link>)}
            {remainingContentChecks.length > 0 && <details className={styles.queueMore}><summary>Show {remainingContentChecks.length} more items</summary>{remainingContentChecks.map((item, index) => <Link key={`${item.href}-${item.group}-${item.detail}-${index + 5}`} href={item.href} className={styles.attentionRow}><span className={styles.alert} aria-hidden="true">!</span><span><strong>{item.label}</strong><small className={styles.attentionDetail}>{item.group} · {item.detail}</small></span><span className={styles.attentionAction}>Fix →</span></Link>)}</details>}
          </> : <p className={styles.queueEmpty}>No publishing, essential-content or metadata issues found.</p>}
        </div>
        <div className={styles.actionQueueColumn}>
          <div className={styles.queueColumnHeader}><h3 className="heading-04">Recent submissions</h3><Link href="/admin/submissions" className={styles.queueViewAll}>View all {submissions.length}<span aria-hidden="true">→</span></Link></div>
          {recentSubmissions.length ? <>
            {recentSubmissions.map((submission) => <Link key={submission.id} href={`/admin/submissions?category=${submission.emailed ? "submitted" : "failed"}#submission-${submission.id}`} className={styles.submissionRow}><span className={styles.submissionMeta}><strong>{submission.name}</strong><time>{formatSubmissionDate(submission.created_at)}</time></span><span className={styles.submissionMessage}>{submission.message}</span><small className={styles.attentionAction}>Review submission →</small></Link>)}
            {olderSubmissions.length > 0 && <details className={styles.queueMore}><summary>Show {olderSubmissions.length} earlier submissions</summary>{olderSubmissions.map((submission) => <Link key={submission.id} href={`/admin/submissions?category=${submission.emailed ? "submitted" : "failed"}#submission-${submission.id}`} className={styles.submissionRow}><span className={styles.submissionMeta}><strong>{submission.name}</strong><time>{formatSubmissionDate(submission.created_at)}</time></span><span className={styles.submissionMessage}>{submission.message}</span><small className={styles.attentionAction}>Review submission →</small></Link>)}</details>}
          </> : <p className={styles.queueEmpty}>No contact submissions yet.</p>}
        </div>
      </div>
    </section>
    <section className={styles.dashboardSection} aria-labelledby="general-metrics"><SectionHeading id="general-metrics" title="Content status · all time" /><div className={styles.stats}><ContentStat href="/admin/case-studies" value={publishedCaseStudies} label="Published case studies" /><ContentStat href="/admin/insights" value={publishedArticles} label="Published articles" /><ContentStat href="/admin/case-studies?status=draft" value={draftCaseStudies} label="Draft case studies" /><ContentStat href="/admin/insights?status=draft" value={draftArticles} label="Draft articles" /></div></section>
  </div>;
}

function SectionHeading({ id, title }: { id: string; title: string }) { return <h2 id={id} className={styles.sectionHeading}>{title}</h2>; }
function parsePageNumber(value?: string | string[]) { const number = Number(Array.isArray(value) ? value[0] : value); return Number.isSafeInteger(number) && number > 0 ? Math.min(number, 1_000_000) : 1; }
function formatSubmissionDate(value: string) { const timestamp = value.includes("T") ? value : `${value.replace(" ", "T")}Z`; return new Date(timestamp).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); }
function stripMarkup(value: string) { return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim(); }
function isValidSlug(value: string) { return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value); }
function isHttpUrl(value: string) { try { const url = new URL(value); return url.protocol === "http:" || url.protocol === "https:"; } catch { return false; } }
function isValidImageReference(value: string) { if (value.startsWith("//")) return false; return /^[a-z][a-z0-9+.-]*:/i.test(value) ? isHttpUrl(value) : true; }
function metadataIssues(input: { title: string; metaTitle: string; metaDescription: string; sourceDescription: string; canonicalUrl: string; ogImage: string; thumbnail: string; cover: string }) {
  const issues: string[] = [];
  if (input.metaTitle.length > 60) issues.push("SEO title exceeds 60 characters");
  if (input.metaDescription.length > 160) issues.push("SEO description exceeds 160 characters");
  if (input.canonicalUrl && !isHttpUrl(input.canonicalUrl)) issues.push("Canonical URL is invalid · use a full http(s) URL");
  if (input.ogImage && !isValidImageReference(input.ogImage)) issues.push("Social image URL is invalid");
  if (!input.ogImage && !input.thumbnail && !input.cover) issues.push("No social sharing image or fallback is set");
  if (!(input.metaTitle || input.title).trim()) issues.push("Search title is missing");
  if (!(input.metaDescription || input.sourceDescription).trim()) issues.push("Search description is missing");
  return issues;
}
function ContentStat({ href, value, label, detail }: { href: string; value: number; label: string; detail?: string }) { return <Link href={href} className={styles.stat}><span className={styles.statValue}>{value}</span><span className="body-small">{label}</span>{detail && <span className={styles.statDetail}>{detail}</span>}</Link>; }
