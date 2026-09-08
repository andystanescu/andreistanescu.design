import Link from "next/link";
import { db } from "@/lib/db";
import { listSubmissions, countSubmissionsSince } from "@/lib/submissions";
import { DashboardGreeting } from "@/components/admin/DashboardGreeting/DashboardGreeting";
import { getAnalyticsCountSince, getVisitorBreakdown } from "@/lib/analytics";
import styles from "./dashboard-home.module.css";

export const dynamic = "force-dynamic";

export default function AdminHomePage() {
  const caseStudies = db.prepare("SELECT id, title, tags, thumbnail_image, published FROM case_studies ORDER BY id DESC").all() as Array<{ id: number; title: string; tags: string; thumbnail_image: string; published: number }>;
  const insights = db.prepare("SELECT id, title, tags, thumbnail_image, published FROM insights ORDER BY id DESC").all() as Array<{ id: number; title: string; tags: string; thumbnail_image: string; published: number }>;
  const submissions = listSubmissions();
  const publishedCaseStudies = caseStudies.filter((item) => item.published).length;
  const publishedArticles = insights.filter((item) => item.published).length;
  const draftCount = caseStudies.filter((item) => !item.published).length + insights.filter((item) => !item.published).length;
  const contentViews = getAnalyticsCountSince("case_study", ["view"]) + getAnalyticsCountSince("article", ["view"]);
  const cvDownloads = getAnalyticsCountSince("cv", ["download"]);
  const contactSubmissions = countSubmissionsSince();
  const visitorBreakdown = getVisitorBreakdown();
  const mostRead = db.prepare(`SELECT analytics_events.content_id AS slug, analytics_events.content_type AS contentType, COUNT(*) AS views, COALESCE(case_studies.title, insights.title) AS title FROM analytics_events LEFT JOIN case_studies ON analytics_events.content_type = 'case_study' AND case_studies.slug = analytics_events.content_id LEFT JOIN insights ON analytics_events.content_type = 'article' AND insights.slug = analytics_events.content_id WHERE analytics_events.event_type = 'view' AND analytics_events.content_type IN ('case_study', 'article') AND analytics_events.created_at >= datetime('now', '-30 days') GROUP BY analytics_events.content_type, analytics_events.content_id ORDER BY views DESC LIMIT 3`).all() as Array<{ slug: string; contentType: "case_study" | "article"; views: number; title: string }>;
  const attention = [...caseStudies.filter((item) => !item.thumbnail_image).map((item) => ({ label: `${item.title} is missing a thumbnail`, href: `/admin/case-studies/${item.id}` })), ...insights.filter((item) => !item.tags.trim()).map((item) => ({ label: `${item.title} has no tags`, href: `/admin/insights/${item.id}` }))].slice(0, 5);

  return <>
    <div className={styles.header}><div><p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>Content control centre</p><DashboardGreeting /></div></div>
    <section className={styles.dashboardSection} aria-labelledby="general-metrics"><SectionHeading id="general-metrics" title="General content metrics" /><div className={styles.stats}><ContentStat href="/admin/case-studies" value={publishedCaseStudies} label="Published case studies" /><ContentStat href="/admin/insights" value={publishedArticles} label="Published articles" /><ContentStat href="/admin/case-studies" value={draftCount} label="Drafts" detail="Articles + case studies" /></div></section>
    <section className={styles.dashboardSection} aria-labelledby="detailed-metrics"><SectionHeading id="detailed-metrics" title="Detailed content metrics" /><div className={styles.detailStats}><Metric value={contentViews} label="Total views, last 30 days" /><Metric value={cvDownloads} label="CV downloads, last 30 days" /><Metric value={contactSubmissions} label="Contact submissions, last 30 days" /></div></section>
    <section className={styles.panel} aria-labelledby="most-read"><div className={styles.panelHeader}><h2 id="most-read" className="heading-03">Most read, last 30 days</h2><span className={styles.panelNote}>What&apos;s actually resonating</span></div>{mostRead.length ? <div className={styles.readList}>{mostRead.map((item, index) => <Link key={`${item.contentType}-${item.slug}`} href={item.contentType === "article" ? `/insights/${item.slug}` : `/work/${item.slug}`} className={styles.readRow}><span className={styles.rank}>{index + 1}</span><span className={styles.readTitle}>{item.title || item.slug}</span><span className={styles.type}>{item.contentType === "article" ? "Article" : "Case study"}</span><span className={styles.views}>{item.views} views</span></Link>)}</div> : <p className="body-small" style={{ color: "var(--text-tertiary)" }}>No content views have been recorded yet.</p>}</section>
    <section className={styles.panel} aria-labelledby="visitors"><div className={styles.panelHeader}><h2 id="visitors" className="heading-03">Where visitors come from, last 30 days</h2><span className={styles.panelNote}>Country-level only, not tracked to the individual</span></div><div className={styles.visitorGrid}><Breakdown title="Source" values={Object.entries(visitorBreakdown.sources)} /><Breakdown title="Location" values={visitorBreakdown.countries} /></div></section>
    <section className={styles.panel} aria-labelledby="attention"><div className={styles.panelHeader}><h2 id="attention" className="heading-03">Needs attention</h2><span className="label-small">{attention.length}</span></div>{attention.length ? attention.map((item) => <Link key={item.href} href={item.href} className={styles.attentionRow}><span className={styles.alert}>!</span><span>{item.label}</span><span aria-hidden="true">›</span></Link>) : <p className="body-small" style={{ color: "var(--text-tertiary)" }}>Everything looks complete.</p>}</section>
    <section className={styles.quickPanel} aria-labelledby="quick-actions"><div className={styles.panelHeader}><h2 id="quick-actions" className="heading-03">Quick actions</h2></div><div className={styles.quick}><Link href="/admin/insights/new">＋ New article</Link><Link href="/admin/case-studies/new">＋ New case study</Link><Link href="/admin/homepage">⌂ Edit homepage</Link><Link href="/admin/submissions">✉ View {submissions.length} submissions</Link></div></section>
  </>;
}

function SectionHeading({ id, title }: { id: string; title: string }) { return <h2 id={id} className={styles.sectionHeading}>{title}</h2>; }
function ContentStat({ href, value, label, detail }: { href: string; value: number; label: string; detail?: string }) { return <Link href={href} className={styles.stat}><span className={styles.statValue}>{value}</span><span className="body-small">{label}</span>{detail && <span className={styles.statDetail}>{detail}</span>}</Link>; }
function Metric({ value, label }: { value: number; label: string }) { return <div className={styles.metric}><span className={styles.metricValue}>{value.toLocaleString()}</span><span className="body-small">{label}</span><span className={styles.comparison}>vs. previous 30 days</span></div>; }
function Breakdown({ title, values }: { title: string; values: Array<[string, number]> }) { const total = values.reduce((sum, [, value]) => sum + value, 0); return <div className={styles.breakdown}><p className={styles.breakdownLabel}>{title}</p>{values.map(([label, value]) => <div key={label} className={styles.breakdownRow}><div className={styles.breakdownTop}><span>{label}</span><span>{total ? Math.round((value / total) * 100) : 0}%</span></div><div className={styles.track}><span style={{ width: `${total ? (value / total) * 100 : 0}%` }} /></div></div>)}</div>; }
