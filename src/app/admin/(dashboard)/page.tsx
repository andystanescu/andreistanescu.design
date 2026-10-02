import Link from "next/link";
import { db } from "@/lib/db";
import { listSubmissions, countSubmissionsSince, countSubmissionsPeriod } from "@/lib/submissions";
import { DashboardGreeting } from "@/components/admin/DashboardGreeting/DashboardGreeting";
import { getAnalyticsCountSince, getAnalyticsCountPeriod, getVisitorBreakdown, getEngagementDashboardData, type EngagementRange } from "@/lib/analytics";
import { MostReadPanel, type MostReadItem } from "./MostReadPanel";
import styles from "./dashboard-home.module.css";

export const dynamic = "force-dynamic";

export default async function AdminHomePage({ searchParams }: { searchParams?: Promise<{ range?: string }> }) {
  const query = searchParams ? await searchParams : {};
  const range: EngagementRange = ["7d", "30d", "90d", "all"].includes(query.range || "") ? query.range as EngagementRange : "30d";
  const engagement = getEngagementDashboardData(range);
  const caseStudies = db.prepare("SELECT id, title, tags, thumbnail_image, published FROM case_studies ORDER BY id DESC").all() as Array<{ id: number; title: string; tags: string; thumbnail_image: string; published: number }>;
  const insights = db.prepare("SELECT id, title, tags, thumbnail_image, published FROM insights ORDER BY id DESC").all() as Array<{ id: number; title: string; tags: string; thumbnail_image: string; published: number }>;
  const submissions = listSubmissions();
  const publishedCaseStudies = caseStudies.filter((item) => item.published).length;
  const publishedArticles = insights.filter((item) => item.published).length;
  const draftCount = caseStudies.filter((item) => !item.published).length + insights.filter((item) => !item.published).length;
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
  const attention = [...caseStudies.filter((item) => !item.thumbnail_image).map((item) => ({ label: `${item.title} is missing a thumbnail`, href: `/admin/case-studies/${item.id}` })), ...insights.filter((item) => !item.tags.trim()).map((item) => ({ label: `${item.title} has no tags`, href: `/admin/insights/${item.id}` }))].slice(0, 5);

  return <>
    <div className={styles.header}><div><p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>Content control centre</p><DashboardGreeting /></div></div>
    <section className={`${styles.panel} ${styles.engagementPanel}`} aria-labelledby="people-engagement">
      <div className={styles.panelHeader}><div><p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>PEOPLE &amp; ENGAGEMENT</p><h2 id="people-engagement" className="heading-02">How many likely-human or uncertain sessions engaged with the work?</h2></div><span className={styles.panelNote}>Counts are tab-scoped sessions, not identified visitors.</span></div>
      <nav className={styles.rangeTabs} aria-label="Engagement date range">{(["7d", "30d", "90d", "all"] as EngagementRange[]).map((value) => <Link key={value} href={value === "30d" ? "/admin" : `/admin?range=${value}`} aria-current={range === value ? "page" : undefined} className={range === value ? styles.rangeActive : undefined}>{value === "all" ? "All time" : `Last ${value.slice(0, -1)} days`}</Link>)}</nav>
      <p className={styles.coverageNote}>This range filters the engagement metrics, content engagement, chapter progression and journeys below. Legacy views, downloads, submissions, most-read content and visitor summaries remain rolling 30-day figures; published and draft counts are all-time totals.</p>
      <div className={styles.engagementStats}>
        <EngagementStat value={engagement.counts.humans} label="Likely-human + uncertain sessions" detail="Includes all sessions not classified as automation" />
        <EngagementStat value={engagement.counts.explored} label="Explored" detail="At least one meaningful progression signal" />
        <EngagementStat value={engagement.counts.engaged} label="Engaged" detail="Content-specific evidence of consumption" />
        <EngagementStat value={engagement.counts.deep} label="Deep" detail="Sustained attention and substantial content depth" />
      </div>
      <p className={styles.funnelNote}>{engagement.counts.engaged} of {engagement.counts.humans} likely-human or uncertain sessions engaged; {engagement.counts.deep} reached deep engagement.</p>
      <div className={styles.qualityStrip}><span><strong>{engagement.counts.uncertain}</strong> uncertain sessions included above</span><span><strong>{engagement.counts.likelyBot + engagement.counts.verifiedBot}</strong> observed automation sessions ({engagement.counts.verifiedBot} verified, {engagement.counts.likelyBot} likely)</span><span><strong>{engagement.counts.portfolioExplorers}</strong> included sessions exploring 3+ content types</span></div>
      <p className={styles.coverageNote}>Classification is a best-effort estimate, not identity verification. Likely-human and uncertain sessions are both included in the engagement and content totals; uncertain means available signals are not strong enough to classify confidently. Known crawler signatures and very rapid, interaction-free page sweeps are classified as automation.</p>
      <p className={styles.coverageNote}>{engagement.trackingStart ? `Engagement tracking has data since ${new Date(`${engagement.trackingStart.replace(" ", "T")}Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}. Older traffic contains no attention or depth data.` : "No engagement sessions are available yet. New engagement tracking begins after this version is deployed; legacy view counts are shown separately below."} Browser-side tracking cannot observe crawlers that do not execute the site scripts.</p>
      {engagement.counts.humans <= 5 && <p className={styles.earlyDataNote}>Early data: this range currently includes {engagement.counts.humans} likely-human or uncertain {engagement.counts.humans === 1 ? "session" : "sessions"}. Treat the pattern as directional, not representative.</p>}
    </section>
    <section className={styles.panel} aria-labelledby="content-engagement"><div className={styles.panelHeader}><h2 id="content-engagement" className="heading-03">Content engagement</h2><span className={styles.panelNote}>Likely-human + uncertain sessions · {range === "all" ? "all time" : `last ${range.slice(0, -1)} days`}</span></div>
      {engagement.content.length ? <><p className={styles.coverageNote}>Attentive active time is counted while a visible, focused tab has recent user input. Scroll reach records the deepest page position observed; reaching 100% means the page end was reached, not that all content was read. Expand a row for progression, scroll, onward and evidence signals. Counts and signals include uncertain sessions.</p><div className={styles.tableWrap}><table className={styles.analyticsTable}><thead><tr><th>Content</th><th>Likely-human + uncertain sessions</th><th>Median attentive active</th><th>Signals</th></tr></thead><tbody>{engagement.content.map((item) => <tr key={item.key}><th scope="row"><Link href={analyticsHref(item.type, item.id, item.key)}>{contentDisplayName(item.type, item.key, item.title)}</Link><small>{contentTypeLabel(item.type)}</small></th><td>{item.humans}</td><td>{formatDuration(item.medianAttention)}</td><td><details className={styles.signalDetails}><summary>View signals</summary><dl><div><dt>Explored</dt><dd>{item.explored}</dd></div><div><dt>Engaged</dt><dd>{item.engaged}</dd></div><div><dt>Deep</dt><dd>{item.deep}</dd></div><div><dt>Scroll reached 25 / 50 / 75 / 90 / 100%</dt><dd>{item.depth25} / {item.depth50} / {item.depth75} / {item.depth90} / {item.reachedEnd}</dd></div><div><dt>Continued to another page</dt><dd>{item.onward}</dd></div>{item.type === "service" && <div><dt>Evidence opened</dt><dd>{item.evidenceOpened}</dd></div>}</dl></details></td></tr>)}</tbody></table></div></> : <p className={styles.emptyAnalytics}>No likely-human or uncertain sessions are available for this range. New metrics begin when tracking is deployed; missing historical data is not treated as zero engagement.</p>}
    </section>
    {engagement.chapters.length > 0 && <section className={styles.panel} aria-labelledby="chapter-depth"><div className={styles.panelHeader}><h2 id="chapter-depth" className="heading-03">Case-study chapter progression</h2><span className={styles.panelNote}>Distinct likely-human + uncertain sessions reaching each chapter</span></div><div className={styles.chapterGrid}>{engagement.chapters.map((chapter) => <div className={styles.chapterRow} key={`${chapter.content_id}-${chapter.detail}`}><span>{chapter.detail}</span><small>{chapter.content_id}</small><strong>{chapter.count}</strong></div>)}</div></section>}
    <section className={styles.panel} aria-labelledby="human-journeys"><div className={styles.panelHeader}><h2 id="human-journeys" className="heading-03">Likely-human + uncertain journeys</h2><span className={styles.panelNote}>Session-level paths; no visitor identity is collected</span></div><p className={styles.coverageNote}>Elapsed span runs from the first recorded event to the latest session update and can include inactive gaps. Attentive active time is summed from the page-level measurements. Uncertain sessions are included.</p>{engagement.journeys.length ? <div className={styles.journeyList}>{engagement.journeys.map((journey, index) => { const activeSeconds = journey.pages.reduce((total, page) => total + page.active_seconds, 0); return <details className={styles.journey} key={`${journey.started}-${index}`}><summary><span>{journey.source}</span><strong>{journey.pages.length} pages · {formatDuration(journey.duration)} elapsed · {formatDuration(activeSeconds)} attentive active · {journey.engagement}</strong><time>{new Date(`${journey.started.replace(" ", "T")}Z`).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</time></summary><ol>{journey.pages.map((page, pageIndex) => <li key={`${page.page_key}-${pageIndex}`}><span>{page.title || page.page_key}</span><small>{formatDuration(page.active_seconds)} attentive active · {page.max_depth ? `${page.max_depth}% deepest scroll reach` : "no scroll-depth signal"}{page.chapter_count ? ` · ${page.chapter_count} reading signals` : ""}</small></li>)}</ol>{journey.actions.length > 0 && <p className={styles.journeyActions}>Actions: {journey.actions.map((action) => action.detail.replaceAll("_", " ")).join(" · ")}</p>}</details>;})}</div> : <p className={styles.emptyAnalytics}>No multi-page likely-human or uncertain journeys are available in this range.</p>}</section>
    <section className={styles.dashboardSection} aria-labelledby="general-metrics"><SectionHeading id="general-metrics" title="General content metrics" /><div className={styles.stats}><ContentStat href="/admin/case-studies" value={publishedCaseStudies} label="Published case studies" /><ContentStat href="/admin/insights" value={publishedArticles} label="Published articles" /><ContentStat href="/admin/case-studies" value={draftCount} label="Drafts" detail="Articles + case studies" /></div></section>
    <details className={styles.legacyTraffic}><summary>Legacy traffic reports <span>Rolling 30-day views, downloads, submissions and visitor summaries</span></summary><div className={styles.legacyTrafficContent}>
      <section className={styles.dashboardSection} aria-labelledby="detailed-metrics"><SectionHeading id="detailed-metrics" title="Detailed content metrics" /><div className={styles.detailStats}><Metric value={contentViews} previous={previousContentViews} label="Unique views, last 30 days" /><Metric value={cvDownloads} previous={previousCvDownloads} label="CV downloads, last 30 days" /><Metric value={contactSubmissions} previous={previousContactSubmissions} label="Contact submissions, last 30 days" /></div></section>
      <MostReadPanel items={mostRead} />
      <section className={styles.panel} aria-labelledby="visitors"><div className={styles.panelHeader}><h2 id="visitors" className="heading-03">Where visitors come from, last 30 days</h2><span className={styles.panelNote}>Country-level only, not tracked to the individual</span></div><div className={styles.visitorGrid}><Breakdown title="Source" values={Object.entries(visitorBreakdown.sources)} /><Breakdown title="Location" values={visitorBreakdown.countries} /></div></section>
    </div></details>
    <section className={styles.panel} aria-labelledby="attention"><div className={styles.panelHeader}><h2 id="attention" className="heading-03">Needs attention</h2><span className="label-small">{attention.length}</span></div>{attention.length ? attention.map((item) => <Link key={item.href} href={item.href} className={styles.attentionRow}><span className={styles.alert}>!</span><span>{item.label}</span><span aria-hidden="true">›</span></Link>) : <p className="body-small" style={{ color: "var(--text-tertiary)" }}>Everything looks complete.</p>}</section>
    <section className={styles.quickPanel} aria-labelledby="quick-actions"><div className={styles.panelHeader}><h2 id="quick-actions" className="heading-03">Quick actions</h2></div><div className={styles.quick}><Link href="/admin/insights/new">＋ New article</Link><Link href="/admin/case-studies/new">＋ New case study</Link><Link href="/admin/homepage">⌂ Edit homepage</Link><Link href="/admin/submissions">✉ View {submissions.length} submissions</Link></div></section>
  </>;
}

function SectionHeading({ id, title }: { id: string; title: string }) { return <h2 id={id} className={styles.sectionHeading}>{title}</h2>; }
function EngagementStat({ value, label, detail }: { value: number; label: string; detail: string }) { return <div className={styles.engagementStat}><span className={styles.statValue}>{value.toLocaleString()}</span><strong>{label}</strong><small>{detail}</small></div>; }
function formatDuration(seconds: number | null) { if (seconds === null) return "—"; if (seconds < 60) return `${seconds}s`; const minutes = Math.floor(seconds / 60); const remainder = seconds % 60; return `${minutes}m ${String(remainder).padStart(2, "0")}s`; }
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
