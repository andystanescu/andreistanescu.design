import Link from "next/link";
import { db } from "@/lib/db";
import { listSubmissions, countSubmissionsSince, countSubmissionsPeriod } from "@/lib/submissions";
import { DashboardGreeting } from "@/components/admin/DashboardGreeting/DashboardGreeting";
import { getAnalyticsCountSince, getAnalyticsCountPeriod, getVisitorBreakdown, getEngagementDashboardData, type EngagementRange } from "@/lib/analytics";
import { ukDateTimeValue } from "@/lib/dateUtils";
import { MostReadPanel, type MostReadItem } from "./MostReadPanel";
import styles from "./dashboard-home.module.css";

export const dynamic = "force-dynamic";

export default async function AdminHomePage({ searchParams }: { searchParams?: Promise<{ range?: string; contentPage?: string | string[]; journeyPage?: string | string[] }> }) {
  const query = searchParams ? await searchParams : {};
  const rawRange = Array.isArray(query.range) ? query.range[0] : query.range;
  const range: EngagementRange = ["7d", "30d", "90d", "all"].includes(rawRange || "") ? rawRange as EngagementRange : "30d";
  const engagement = getEngagementDashboardData(range, { contentPage: parsePageNumber(query.contentPage), journeyPage: parsePageNumber(query.journeyPage) });
  const periodLabel = range === "all" ? "All time" : `Last ${range.slice(0, -1)} days`;
  const trackingStartLabel = engagement.trackingStart
    ? new Date(`${engagement.trackingStart.replace(" ", "T")}Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "Not started";
  const earlySample = engagement.counts.humans <= 5;
  const caseStudies = db.prepare("SELECT id, slug, title, description, body, tags, thumbnail_image, cover_image, published, body_draft_enabled, meta_title, meta_description, canonical_url, og_image FROM case_studies ORDER BY id DESC").all() as Array<{ id: number; slug: string; title: string; description: string; body: string; tags: string; thumbnail_image: string; cover_image: string; published: number; body_draft_enabled: number; meta_title: string; meta_description: string; canonical_url: string; og_image: string }>;
  const caseStudiesBySlug = new Map(caseStudies.map((caseStudy) => [caseStudy.slug, caseStudy]));
  const insights = db.prepare("SELECT id, slug, title, excerpt, body, tags, thumbnail_image, cover_image, published, scheduled_at, meta_title, meta_description, canonical_url, og_image FROM insights ORDER BY id DESC").all() as Array<{ id: number; slug: string; title: string; excerpt: string; body: string; tags: string; thumbnail_image: string; cover_image: string; published: number; scheduled_at: string; meta_title: string; meta_description: string; canonical_url: string; og_image: string }>;
  const submissions = listSubmissions();
  const recentSubmissions = submissions.slice(0, 5);
  const olderSubmissions = submissions.slice(5);
  const publishedCaseStudies = caseStudies.filter((item) => item.published).length;
  const publishedArticles = insights.filter((item) => item.published).length;
  const draftCaseStudies = caseStudies.filter((item) => !item.published).length;
  const draftArticles = insights.filter((item) => !item.published).length;
  const contentViews = getAnalyticsCountSince("case_study", ["view"]) + getAnalyticsCountSince("article", ["view"]);
  const previousContentViews = getAnalyticsCountPeriod("case_study", ["view"], 60, 30) + getAnalyticsCountPeriod("article", ["view"], 60, 30);
  const cvDownloads = getAnalyticsCountSince("cv", ["download"]);
  const previousCvDownloads = getAnalyticsCountPeriod("cv", ["download"], 60, 30);
  const contactSubmissions = countSubmissionsSince();
  const previousContactSubmissions = countSubmissionsPeriod(60, 30);
  const visitorBreakdown = getVisitorBreakdown();
  const mostReadRows = db.prepare(`SELECT analytics_events.content_id AS slug, analytics_events.content_type AS contentType, COUNT(*) AS views, COALESCE(case_studies.title, insights.title) AS title FROM analytics_events LEFT JOIN case_studies ON analytics_events.content_type = 'case_study' AND case_studies.slug = analytics_events.content_id LEFT JOIN insights ON analytics_events.content_type = 'article' AND insights.slug = analytics_events.content_id WHERE analytics_events.event_type = 'view' AND analytics_events.content_type IN ('case_study', 'article') AND analytics_events.created_at >= datetime('now', '-30 days') GROUP BY analytics_events.content_type, analytics_events.content_id HAVING COUNT(*) >= 1 ORDER BY views DESC, title ASC`).all() as MostReadItem[];
  const mostRead = mostReadRows.map((item) => ({
    slug: item.slug,
    contentType: item.contentType,
    views: item.views,
    title: item.title,
  }));
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
        <div className={styles.headerCoverageItem}><span>Tracking since</span><strong>{trackingStartLabel}</strong></div>
        <div className={`${styles.headerCoverageItem} ${earlySample ? styles.headerSampleEarly : styles.headerSampleReady}`}><span>Engagement sample</span><strong>{earlySample ? `Early · ${engagement.counts.humans} sessions` : `${engagement.counts.humans} sessions · past early threshold`}</strong></div>
      </div>
    </div>
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
    <section className={styles.quickPanel} aria-labelledby="quick-actions"><div className={styles.panelHeader}><h2 id="quick-actions" className="heading-03">Quick actions</h2></div><div className={styles.quick}><Link href="/admin/insights/new">＋ New article</Link><Link href="/admin/case-studies/new">＋ New case study</Link><Link href="/admin/homepage">⌂ Edit homepage</Link><Link href="/admin/submissions">✉ View {submissions.length} submissions</Link></div></section>
    <section className={`${styles.panel} ${styles.engagementPanel}`} aria-labelledby="engagement-overview">
      <div className={styles.panelHeader}><div><p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>PEOPLE &amp; ENGAGEMENT</p><h2 id="engagement-overview" className="heading-02">Engagement overview</h2></div></div>
      <nav className={styles.rangeTabs} aria-label="Engagement date range">{(["7d", "30d", "90d", "all"] as EngagementRange[]).map((value) => <Link key={value} href={value === "30d" ? "/admin" : `/admin?range=${value}`} aria-current={range === value ? "page" : undefined} className={range === value ? styles.rangeActive : undefined}>{value === "all" ? "All time" : `Last ${value.slice(0, -1)} days`}</Link>)}</nav>
      <p className={styles.coverageNote}>This range applies to engagement, content signals, chapter progression and journeys. Legacy traffic below stays at 30 days; published and draft counts are all-time totals.</p>
      <div className={styles.engagementStats}>
        <EngagementStat value={engagement.counts.humans} label="Likely-human or uncertain sessions" detail="Tab-scoped sessions included in this report" />
        <EngagementStat value={engagement.counts.explored} label="Explored" detail="At least one meaningful progression signal" />
        <EngagementStat value={engagement.counts.engaged} label="Engaged" detail="Content-specific evidence of consumption" />
        <EngagementStat value={engagement.counts.deep} label="Deep" detail="Sustained attention and substantial content depth" />
      </div>
      <details className={styles.countingDetails}>
        <summary>How this is counted</summary>
        <div className={styles.countingContent}>
          <p><strong>Sessions.</strong> A session is a single browser tab, not an identified person. Likely-human and uncertain sessions are included; known crawlers and very rapid, interaction-free page sweeps are excluded. Of the sessions in this range, {engagement.counts.uncertain} remain uncertain and {engagement.counts.likelyBot + engagement.counts.verifiedBot} are classified as automation ({engagement.counts.verifiedBot} verified, {engagement.counts.likelyBot} likely). Classification is a best-effort estimate, not identity verification.</p>
          <p><strong>Engagement levels.</strong> Explored requires at least 20 seconds of attentive time, 25% scroll reach, an interaction, a chapter view, or two pages in one session. Engaged/deep thresholds vary by type: articles use 60s + 50% depth or 90s + 25% for engaged, and 180s + 90% for deep; case studies use 90s + 3 chapters or 120s + 50% depth, and 180s + 4 chapters; service pages use 45s + 60% depth or 90s + an interaction, and 120s + 75% depth + an interaction; other pages use 45s + 50% depth and 120s + 75% depth. A session inherits its highest page level, and can also qualify as engaged across 3 content types + 60s attentive time, or deep across 5 types + 5 pages + 180s. These levels indicate evidence, not proof that all content was read.</p>
          <p><strong>Attention and scroll.</strong> Attentive active time accrues while a tab is visible and focused after recent user input. Scroll reach is the deepest page position recorded; 100% means the page end was reached, not that it was fully consumed.</p>
          <p><strong>Journeys and portfolio exploration.</strong> Journey elapsed time spans the first to last recorded event and can include inactive gaps; attentive active time sums the page measurements. {engagement.counts.portfolioExplorers} sessions in this range visited three or more content types (portfolio explorers).</p>
          <p><strong>Coverage.</strong> {engagement.trackingStart ? `Engagement tracking has data since ${new Date(`${engagement.trackingStart.replace(" ", "T")}Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}; older visits have no attention or depth data.` : "No engagement sessions are available yet. New metrics begin after tracking is deployed; older visits have no attention or depth data."} Browser-side tracking cannot observe crawlers that do not run site scripts.</p>
        </div>
      </details>
    </section>
    <section className={styles.panel} aria-labelledby="content-engagement"><div className={styles.panelHeader}><h2 id="content-engagement" className="heading-03">Content engagement</h2><span className={styles.panelNote}>Likely-human + uncertain sessions · {range === "all" ? "all time" : `last ${range.slice(0, -1)} days`}</span></div>
      {engagement.content.length ? <><p className={styles.coverageNote}>Showing {analyticsRangeStart(engagement.contentPage, engagement.contentPageSize, engagement.contentTotal)}–{analyticsRangeEnd(engagement.contentPage, engagement.contentPageSize, engagement.contentTotal)} of {engagement.contentTotal} content entries. Expand a row to see progression, scroll reach, onward visits and evidence openings.</p><div className={styles.tableWrap}><table className={styles.analyticsTable}><thead><tr><th>Content</th><th>Sessions</th><th>Median attentive active</th><th>Signals</th></tr></thead><tbody>{engagement.content.map((item) => <tr key={item.key}><th scope="row"><Link href={analyticsHref(item.type, item.id, item.key)}>{contentDisplayName(item.type, item.key, item.title)}</Link><small>{contentTypeLabel(item.type)}</small></th><td data-label="Sessions">{item.humans}</td><td data-label="Median attentive active">{formatDuration(item.medianAttention)}</td><td data-label="Signals"><details className={styles.signalDetails}><summary>View signals</summary><dl><div><dt>Explored</dt><dd>{item.explored}</dd></div><div><dt>Engaged</dt><dd>{item.engaged}</dd></div><div><dt>Deep</dt><dd>{item.deep}</dd></div><div><dt>Scroll reached 25 / 50 / 75 / 90 / 100%</dt><dd>{item.depth25} / {item.depth50} / {item.depth75} / {item.depth90} / {item.reachedEnd}</dd></div><div><dt>Continued to another page</dt><dd>{item.onward}</dd></div>{item.type === "service" && <div><dt>Evidence opened</dt><dd>{item.evidenceOpened}</dd></div>}</dl></details></td></tr>)}</tbody></table></div><AnalyticsPagination page={engagement.contentPage} pageSize={engagement.contentPageSize} total={engagement.contentTotal} range={range} param="contentPage" otherParam="journeyPage" otherPage={engagement.journeyPage} label="Content analytics pages" /></> : <p className={styles.emptyAnalytics}>No likely-human or uncertain sessions are available for this range. New metrics begin when tracking is deployed; missing historical data is not treated as zero engagement.</p>}
    </section>
    {engagement.chapters.length > 0 && <section className={styles.panel} aria-labelledby="chapter-depth"><div className={styles.panelHeader}><h2 id="chapter-depth" className="heading-03">Case-study chapter progression</h2><span className={styles.panelNote}>Distinct likely-human + uncertain sessions reaching each chapter</span></div><div className={styles.chapterGrid}>{engagement.chapters.map((chapter) => { const caseStudy = caseStudiesBySlug.get(chapter.content_id); return <div className={styles.chapterRow} key={`${chapter.content_id}-${chapter.detail}`}><div className={styles.chapterInfo}><span>{chapter.detail}</span>{caseStudy ? <Link href={`/admin/case-studies/${caseStudy.id}`} className={styles.chapterTitle}>{caseStudy.title}</Link> : <span className={styles.chapterTitle}>Case study unavailable</span>}</div><strong>{chapter.count}</strong></div>;})}</div></section>}
    <section className={styles.panel} aria-labelledby="human-journeys"><div className={styles.panelHeader}><h2 id="human-journeys" className="heading-03">Likely-human or uncertain journeys</h2><span className={styles.panelNote}>{engagement.journeyTotal ? `${engagement.journeyTotal} qualifying journeys · newest first · 10 per page` : "No qualifying journeys in this period"}</span></div>{engagement.journeys.length ? <><div className={styles.journeyList}>{engagement.journeys.map((journey, index) => { const activeSeconds = journey.pages.reduce((total, page) => total + page.active_seconds, 0); return <details className={styles.journey} key={`${journey.started}-${index}`}><summary><span>{journey.source}</span><strong>{journey.pageCount} pages · {formatDuration(journey.duration)} elapsed · {formatDuration(activeSeconds)} attentive active · {journey.engagement}</strong><time>{new Date(`${journey.started.replace(" ", "T")}Z`).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</time></summary><ol>{journey.pages.map((page, pageIndex) => <li key={`${page.page_key}-${pageIndex}`}><span>{page.title || page.page_key}</span><small>{formatDuration(page.active_seconds)} attentive active · {page.max_depth ? `${page.max_depth}% deepest scroll reach` : "no scroll-depth signal"}{page.chapter_count ? ` · ${page.chapter_count} reading signals` : ""}</small></li>)}</ol>{journey.pages.length < journey.pageCount && <p className={styles.journeyActions}>Showing the first {journey.pages.length} pages for this session.</p>}{journey.actions.length > 0 && <p className={styles.journeyActions}>{journey.actionCount > journey.actions.length ? `Latest ${journey.actions.length} of ${journey.actionCount} actions: ` : "Actions: "}{journey.actions.map((action) => action.detail.replaceAll("_", " ")).join(" · ")}</p>}</details>;})}</div><AnalyticsPagination page={engagement.journeyPage} pageSize={engagement.journeyPageSize} total={engagement.journeyTotal} range={range} param="journeyPage" otherParam="contentPage" otherPage={engagement.contentPage} label="Journey pages" /></> : <p className={styles.emptyAnalytics}>No multi-page likely-human or uncertain journeys are available in this range.</p>}</section>
    <section className={styles.dashboardSection} aria-labelledby="general-metrics"><SectionHeading id="general-metrics" title="Content status · all time" /><div className={styles.stats}><ContentStat href="/admin/case-studies" value={publishedCaseStudies} label="Published case studies" /><ContentStat href="/admin/insights" value={publishedArticles} label="Published articles" /><ContentStat href="/admin/case-studies?status=draft" value={draftCaseStudies} label="Draft case studies" /><ContentStat href="/admin/insights?status=draft" value={draftArticles} label="Draft articles" /></div></section>
    <details className={styles.legacyTraffic}><summary>Traffic · last 30 days <span>Fixed window, independent of the Engagement date range</span></summary><div className={styles.legacyTrafficContent}>
      <section className={styles.dashboardSection} aria-labelledby="detailed-metrics"><SectionHeading id="detailed-metrics" title="Detailed content metrics" /><div className={styles.detailStats}><Metric value={contentViews} previous={previousContentViews} label="Unique views, last 30 days" /><Metric value={cvDownloads} previous={previousCvDownloads} label="CV downloads, last 30 days" /><Metric value={contactSubmissions} previous={previousContactSubmissions} label="Contact submissions, last 30 days" /></div></section>
      <MostReadPanel items={mostRead} />
      <section className={styles.panel} aria-labelledby="visitors"><div className={styles.panelHeader}><h2 id="visitors" className="heading-03">Where visitors come from, last 30 days</h2><span className={styles.panelNote}>Country-level only, not tracked to the individual</span></div><div className={styles.visitorGrid}><Breakdown title="Source" values={Object.entries(visitorBreakdown.sources)} /><Breakdown title="Location" values={visitorBreakdown.countries} /></div></section>
    </div></details>
  </div>;
}

function SectionHeading({ id, title }: { id: string; title: string }) { return <h2 id={id} className={styles.sectionHeading}>{title}</h2>; }
function parsePageNumber(value?: string | string[]) { const number = Number(Array.isArray(value) ? value[0] : value); return Number.isSafeInteger(number) && number > 0 ? Math.min(number, 1_000_000) : 1; }
function analyticsRangeStart(page: number, pageSize: number, total: number) { return total ? (page - 1) * pageSize + 1 : 0; }
function analyticsRangeEnd(page: number, pageSize: number, total: number) { return Math.min(page * pageSize, total); }
function AnalyticsPagination({ page, pageSize, total, range, param, otherParam, otherPage, label }: { page: number; pageSize: number; total: number; range: EngagementRange; param: "contentPage" | "journeyPage"; otherParam: "contentPage" | "journeyPage"; otherPage: number; label: string }) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  const hrefFor = (nextPage: number) => {
    const query = new URLSearchParams();
    if (range !== "30d") query.set("range", range);
    query.set(param, String(nextPage));
    if (otherPage > 1) query.set(otherParam, String(otherPage));
    return `/admin?${query.toString()}`;
  };
  return <nav className={styles.analyticsPagination} aria-label={label}><span>Page {page} of {pages}</span><div>{page > 1 && <Link href={hrefFor(page - 1)}>← Previous</Link>}{page < pages && <Link href={hrefFor(page + 1)}>Next →</Link>}</div></nav>;
}
function EngagementStat({ value, label, detail }: { value: number; label: string; detail: string }) { return <div className={styles.engagementStat}><span className={styles.statValue}>{value.toLocaleString()}</span><strong>{label}</strong><small>{detail}</small></div>; }
function formatDuration(seconds: number | null) { if (seconds === null) return "—"; if (seconds < 60) return `${seconds}s`; const minutes = Math.floor(seconds / 60); const remainder = seconds % 60; return `${minutes}m ${String(remainder).padStart(2, "0")}s`; }
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
function contentTypeLabel(type: string) { return ({ case_study: "Case study", article: "Article", service: "Service page", home: "Home", work_index: "Work index", articles_index: "Articles index", services_index: "Services index", about: "About", contact: "Contact", page: "Page" } as Record<string, string>)[type] || type; }
function contentDisplayName(type: string, key: string, title: string) {
  if (type === "case_study" || type === "article" || type === "service") return title;
  const separator = key.indexOf(":");
  const path = (separator >= 0 ? key.slice(separator + 1) : key).split(/[?#]/, 1)[0] || "/";
  const knownNames: Record<string, string> = { "/": "Homepage", "/contact": "Contact", "/about": "About", "/work": "Case studies", "/insights": "Articles", "/services": "Services" };
  if (knownNames[path]) return knownNames[path];
  if (type === "home") return "Homepage";
  if (type === "contact") return "Contact";
  if (type === "about") return "About";
  if (type === "page") return path.split("/").filter(Boolean).map((segment) => segment.replaceAll("-", " ").replace(/\b\w/g, (character) => character.toUpperCase())).join(" / ") || "Homepage";
  return title && !title.includes("ConScept") && !title.startsWith("/") ? title : path;
}
function analyticsHref(type: string, id: string, key: string) { if (type === "case_study") return `/work/${id}`; if (type === "article") return `/insights/${id}`; if (type === "service") return `/services/${id}`; const separator = key.indexOf(":"); return separator >= 0 ? key.slice(separator + 1) || "/" : key || "/"; }
function ContentStat({ href, value, label, detail }: { href: string; value: number; label: string; detail?: string }) { return <Link href={href} className={styles.stat}><span className={styles.statValue}>{value}</span><span className="body-small">{label}</span>{detail && <span className={styles.statDetail}>{detail}</span>}</Link>; }
function Metric({ value, previous, label }: { value: number; previous: number; label: string }) {
  const direction = value > previous ? "up" : value < previous ? "down" : "same";
  const change = previous === 0 ? (value > 0 ? "New" : "0%") : `${Math.round(Math.abs((value - previous) / previous) * 100)}%`;
  const symbol = direction === "up" ? "↑" : direction === "down" ? "↓" : "—";
  return <div className={styles.metric}><span className={styles.metricValue}>{value.toLocaleString()}</span><span className="body-small">{label}</span><span className={styles.comparison}>vs. previous 30 days <span className={`${styles.comparisonPill} ${styles[direction]}`}>{symbol} {change}</span></span></div>;
}
function Breakdown({ title, values }: { title: string; values: Array<[string, number]> }) { const total = values.reduce((sum, [, value]) => sum + value, 0); return <div className={styles.breakdown}><p className={styles.breakdownLabel}>{title}</p>{values.map(([label, value]) => <div key={label} className={styles.breakdownRow}><div className={styles.breakdownTop}><span>{label}</span><span>{total ? Math.round((value / total) * 100) : 0}%</span></div><div className={styles.track}><span style={{ width: `${total ? (value / total) * 100 : 0}%` }} /></div></div>)}</div>; }
