import Link from "next/link";
import { AdminIcon } from "@/components/admin/AdminIcon/AdminIcon";
import type { EngagementRange, getEngagementDashboardData } from "@/lib/analytics";
import { displayJourneyCountry } from "@/lib/journeyContext";
import styles from "./VisitorJourneys.module.css";

type Journey = ReturnType<typeof getEngagementDashboardData>["journeys"][number];
type Props = { journeys: Journey[]; total: number; page: number; pageSize: number; range: EngagementRange; contentType: string | null; contentPage: number; titles: Record<string, string> };
const actionLabels: Record<string, string> = { contact_submission: "Enquiry received", contact_cta: "Contact selected", cv_download: "CV selected", evidence_open: "Evidence selected", related_open: "Related content selected", chapter_navigation: "Chapter selected", category_filter: "Category selected" };
function duration(value: number) { return value < 60 ? `${value}s` : `${Math.floor(value / 60)}m ${String(value % 60).padStart(2, "0")}s`; }
function date(value: string) { return new Date(`${value.replace(" ", "T")}Z`).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); }
function typeName(type: string) { return type === "case_study" ? "Case study" : type === "article" ? "Article" : type === "service" ? "Service" : "General page"; }
function pageName(page: Journey["pages"][number], titles: Record<string, string>) {
  const known: Record<string, string> = { "/": "Homepage", "/about": "About", "/contact": "Contact", "/work": "Case studies", "/services": "Services", "/insights": "Articles" };
  return titles[page.page_key] || known[page.page_key] || (page.title && !page.title.includes("ConScept") ? page.title : page.page_key);
}
function ExpandIcon() { return <span className={styles.expand} aria-hidden="true"><AdminIcon name="action-plus" className={styles.plus} /><AdminIcon name="action-minus" className={styles.minus} /></span>; }
function href(props: Props, page: number) { const q = new URLSearchParams(); if (props.range !== "30d") q.set("range", props.range); if (props.contentType) q.set("contentType", props.contentType); if (props.contentPage > 1) q.set("contentPage", String(props.contentPage)); if (page > 1) q.set("journeyPage", String(page)); return `/admin${q.size ? `?${q}` : ""}#visitor-journeys`; }

export function VisitorJourneys(props: Props) {
  const { journeys, total, page, pageSize, titles } = props;
  const pages = Math.ceil(total / pageSize);
  return <section className={styles.panel} id="visitor-journeys" aria-labelledby="visitor-journeys-title">
    <header className={styles.header}><h2 id="visitor-journeys-title">Visitor journeys</h2><p>Likely-human and uncertain sessions · most recent first</p></header>
    {journeys.length ? <><div className={styles.columns}><span /><span>When</span><span>Source · Country</span><span>First viewed pages</span><span>Pages</span><span>Active attention</span><span>Outcome</span></div>
      {journeys.map((journey, index) => {
        const outcome = journey.contacted ? "Enquiry received" : journey.engagement === "deep" ? "Deep" : journey.engagement === "engaged" ? "Engaged" : journey.engagement === "explored" ? "Explored" : "Visited";
        const path = journey.pages.map((item) => pageName(item, titles)).join(" → ");
        const location = `${journey.source} · ${displayJourneyCountry(journey.country)}`;
        return <details className={styles.journey} key={`${journey.started}-${index}`}>
          <summary className={styles.summary}><ExpandIcon /><span className={styles.when}><strong>{date(journey.started)}</strong><small>{location}</small></span><span className={styles.source} title={location}>{location}</span><span className={styles.path} title={path}>{path}</span><span className={styles.count}>{journey.pageCount}<span className={styles.pagesWord}> pages</span></span><strong className={styles.attention}><span className={styles.mobileCount}>{journey.pageCount} pages · </span>{duration(journey.activeSeconds)}<span className={styles.activeWord}> active</span></strong><span className={`${styles.tag} ${journey.contacted ? styles.highlight : ""}`}>{outcome}</span></summary>
          <div className={styles.detail}>
            <p className={styles.context}>{journey.classification === "likely_human" ? "Likely human" : "Uncertain"} · {location} · {date(journey.started)} · {duration(journey.duration)} elapsed</p>
            <p className={styles.explanation}>Pages appear in order first recorded. Attention and exposure are totals for each page across the session; repeat visits are combined.</p>
            <div className={styles.stepColumns}><span>Page</span><span>Active attention</span><span>Exposure</span><span>Significant interaction</span></div>
            <ol className={styles.steps}>{journey.pages.map((item, pageIndex) => {
              const signals = [...new Set(journey.actions.filter((action) => action.page_key === item.page_key).map((action) => actionLabels[action.detail]).filter(Boolean))];
              if (item.engagement_level === "deep") signals.unshift("Deep engagement");
              const exposure = item.eligible && item.eligible > 0 ? Math.round(Math.min(item.attended, item.eligible) / item.eligible * 100) : null;
              return <li className={styles.step} key={item.page_key}><span className={`${styles.marker} ${signals.length ? styles.markerActive : ""}`} aria-hidden="true" /><div className={styles.stepPage}><strong><span>{pageIndex + 1}</span> {pageName(item, titles)}</strong><span className={styles.stepType}>{typeName(item.content_type)}</span><small>{typeName(item.content_type)} · {duration(item.active_seconds)} active · {exposure === null ? "exposure unavailable" : `${exposure}% attentive exposure`}</small></div><span className={styles.stepAttention}>{duration(item.active_seconds)}</span><span className={styles.stepExposure}>{exposure === null ? "—" : `${exposure}%`}</span><span className={styles.signals}>{signals.map((signal) => <span className={`${styles.tag} ${styles.highlight}`} key={signal}>{signal}</span>)}</span></li>;
            })}</ol>
            {journey.pages.length < journey.pageCount && <p className={styles.explanation}>Showing the first {journey.pages.length} of {journey.pageCount} recorded pages.</p>}
            <details className={styles.diagnostics}><summary>How this journey was classified <ExpandIcon /></summary><p>{journey.classification === "uncertain" ? "There was not enough recorded evidence to classify this session as likely human." : journey.measurementVersion >= 2 ? "This session met the current attention and interaction thresholds for likely-human activity." : "This older session met the previous likely-human rules; it was not reclassified using newer rules."} Its {journey.engagement} engagement level is based on the recorded page and session signals. Missing events may affect the result.</p>{journey.actionCount > journey.actions.length && <p>Showing the latest {journey.actions.length} of {journey.actionCount} recorded actions.</p>}</details>
          </div>
        </details>;
      })}
      <nav className={styles.footer} aria-label="Visitor journey pages"><span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} qualifying journeys</span><div>{page > 1 && <Link href={href(props, page - 1)}>Previous</Link>}{page < pages && <Link href={href(props, page + 1)}>Show more journeys</Link>}</div></nav>
    </> : <p className={styles.empty}>No qualifying journeys are available for this period.</p>}
  </section>;
}
