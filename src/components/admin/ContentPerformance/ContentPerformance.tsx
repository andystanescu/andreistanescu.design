import Link from "next/link";
import type { ContentGroup, ContentPerformanceData, PerformanceGroup, PerformanceItem } from "@/lib/contentPerformance";
import type { OverviewRange } from "@/lib/engagementOverview";
import { AdminIcon } from "@/components/admin/AdminIcon/AdminIcon";
import styles from "./ContentPerformance.module.css";

const labels: Record<ContentGroup, string> = { case_study: "Case studies", article: "Articles", service: "Services", general: "General pages" };
type Props = { data: ContentPerformanceData; range: OverviewRange; titles: Record<string, string>; editLinks: Record<string, string>; journeyPage: number };

function ExpandIcon() {
  return <span className={styles.expandIcon} aria-hidden="true"><AdminIcon name="action-plus" className={styles.expandPlus} /><AdminIcon name="action-minus" className={styles.expandMinus} /></span>;
}

function duration(value: number | null) {
  if (value === null) return "—";
  if (value < 60) return `${value}s`;
  return `${Math.floor(value / 60)}m ${String(value % 60).padStart(2, "0")}s`;
}
function name(item: PerformanceItem, titles: Record<string, string>) {
  if (titles[item.pageKey]) return titles[item.pageKey];
  const known: Record<string, string> = { "/": "Homepage", "/contact": "Contact", "/about": "About", "/work": "Case studies", "/insights": "Articles", "/services": "Services" };
  return known[item.pageKey] || (item.title && !item.title.includes("ConScept") && !item.title.startsWith("/") ? item.title : item.pageKey.split("/").filter(Boolean).map((part) => part.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())).join(" / ") || "Homepage");
}
function href(range: OverviewRange, group: ContentGroup | null, page: number, journeyPage: number) {
  const params = new URLSearchParams();
  if (range !== "30d") params.set("range", range);
  if (group) params.set("contentType", group);
  if (group && page > 1) params.set("contentPage", String(page));
  if (journeyPage > 1) params.set("journeyPage", String(journeyPage));
  return `/admin${params.size ? `?${params}` : ""}#content-performance`;
}
function exposure(item: PerformanceItem) {
  return item.measuredSessions >= 20 && item.exposurePercent !== null ? `${item.exposurePercent}%` : "—";
}
function exposureDetail(item: PerformanceItem) {
  if (!item.measuredSessions) return "Not measured for these sessions";
  return item.measuredSessions < 20 ? `Insufficient data · ${item.measuredSessions} measurable sessions` : `${item.measuredSessions} measurable sessions`;
}
function Item({ item, titles, editLinks, range, peers }: { item: PerformanceItem; titles: Record<string, string>; editLinks: Record<string, string>; range: OverviewRange; peers: PerformanceItem[] }) {
  const title = name(item, titles);
  const rate = item.sessions >= 20 ? Math.round((item.engaged / item.sessions) * 100) : null;
  const safeLink = /^\/(?:[\w\-/]*)$/.test(item.pageKey);
  const comparison = [item, ...peers.filter((peer) => peer.pageKey !== item.pageKey && peer.sessions >= 20)].slice(0, 3);
  const comparable = item.sessions >= 20 && comparison.length > 1;
  const maxEngaged = Math.max(0, ...comparison.map((peer) => peer.engaged));
  const typeLabel = item.group === "case_study" ? "Case study" : item.group === "article" ? "Article" : item.group === "service" ? "Service" : "Page";
  return <details className={styles.item}>
    <summary className={styles.itemSummary}>
      <span className={styles.itemTitle} title={title}>{title}</span>
      <span className={styles.sessions}><span className={styles.srOnly}>Likely-human sessions: </span>{item.sessions}</span>
      <span className={styles.engaged}><span className={styles.bar} aria-hidden="true">{rate !== null && <i style={{ width: `${rate}%` }} />}</span><strong>{item.engaged}</strong><small>Engaged</small><span className={styles.srOnly}> engaged sessions</span></span>
      <span className={styles.attention}><span>{duration(item.medianAttention)}</span><small>Attention</small><span className={styles.srOnly}> median attentive time per page session</span></span>
      <span className={styles.exposure}><span className={styles.exposureBar} aria-hidden="true">{item.measuredSessions >= 20 && item.exposurePercent !== null && <i style={{ width: `${item.exposurePercent}%` }} />}</span><span>{exposure(item)}</span><small>Exposure</small><span className={styles.srOnly}> mean attentive section exposure</span></span>
      <span className={styles.deep}><span className={styles.srOnly}>Deep engagements: </span>{item.deep}</span><ExpandIcon />
    </summary>
    <div className={styles.itemDetails}>
      <header className={styles.detailHeader}>
        <div className={styles.detailMeta}><span className={styles.detailTag}>{typeLabel}</span><span>{range === "all" ? "All time" : `Last ${range.slice(0, -1)} days`}</span></div>
        <h3>{title}</h3>
        <div className={styles.detailLinks}>{safeLink && <Link href={item.pageKey}>View page ↗</Link>}{editLinks[item.pageKey] && <Link href={editLinks[item.pageKey]}>Edit {typeLabel.toLowerCase()}</Link>}</div>
      </header>
      <div className={`${styles.detailMetrics} ${styles.detailMetricsThree}`}>
        <div><span>Likely-human sessions</span><strong>{item.sessions.toLocaleString()}</strong><small>Sessions on this page</small></div>
        <div><span>Meaningfully engaged</span><strong>{item.engaged.toLocaleString()}</strong><small>{rate === null ? "Not enough sessions for a rate" : `${rate}% of this page’s sessions`}</small></div>
        <div><span>Deep engagements</span><strong>{item.deep.toLocaleString()}</strong><small>{item.engaged >= 20 ? `${Math.round(item.deep / item.engaged * 100)}% of engaged sessions` : "Not enough engaged sessions for a rate"}</small></div>
      </div>
      <div className={`${styles.detailMetrics} ${styles.detailMetricsTwo}`}>
        <div><span>Active attention</span><strong>{duration(item.medianAttention)}</strong><small>Median per page session</small></div>
        <div><span>Meaningful exposure</span><strong>{exposure(item)}</strong><small>{item.measuredSessions >= 20 ? `Mean share of sections · ${item.measuredSessions} measurable sessions` : exposureDetail(item)}</small></div>
      </div>
      <section className={styles.comparison} aria-label={`Comparison with ${labels[item.group].toLowerCase()}`}>
        <h4>Compared with other {labels[item.group].toLowerCase()}</h4>
        {comparable ? <><div className={styles.comparisonRows}>{comparison.map((peer, index) => <div className={styles.comparisonRow} key={peer.pageKey}><span title={index === 0 ? title : name(peer, titles)}>{index === 0 ? "This page" : name(peer, titles)}</span><span className={styles.comparisonBar} aria-hidden="true"><i className={index === 0 ? styles.currentBar : undefined} style={{ width: `${maxEngaged ? peer.engaged / maxEngaged * 100 : 0}%` }} /></span><strong>{peer.engaged} engaged</strong></div>)}</div><p>Showing available pages in this group, ranked by engaged sessions.</p></> : <p>Comparison is available when at least two displayed pages each have 20 likely-human sessions.</p>}
      </section>
      <details className={styles.diagnostics}><summary>Additional signals <ExpandIcon /></summary>
      <dl>
        <div><dt>Likely-human sessions</dt><dd>{item.sessions}</dd></div>
        <div><dt>Engagement rate</dt><dd>{rate === null ? "Insufficient data · fewer than 20 sessions" : `${rate}% · ${item.engaged} of ${item.sessions} sessions`}</dd></div>
        <div><dt>Median attentive time per page session</dt><dd>{duration(item.medianAttention)}</dd></div>
        <div><dt>Mean attentive section exposure</dt><dd>{exposure(item)} · {exposureDetail(item)}</dd></div>
        <div><dt>Scroll reach 25 / 50 / 75 / 90 / 100%</dt><dd>{item.depth25} / {item.depth50} / {item.depth75} / {item.depth90} / {item.reachedEnd}</dd></div>
        <div><dt>Sessions with a later recorded page view</dt><dd>{item.onward}</dd></div>
        {item.measuredSessions > 0 && <><div><dt>Sessions returning to a section</dt><dd>{item.returns} of {item.measuredSessions} measurable sessions</dd></div>{item.outcomeMeasured > 0 && <div><dt>Sessions reaching outcomes</dt><dd>{item.outcomesReached} of {item.outcomeMeasured} sessions with identifiable outcomes</dd></div>}</>}
        {item.trackedSessions > 0 && <><div><dt>Related reading selected</dt><dd>{item.relatedOpened} of {item.trackedSessions} newer-tracker sessions</dd></div>{item.group === "service" && <div><dt>Supporting evidence selected</dt><dd>{item.evidenceOpened} of {item.trackedSessions} newer-tracker sessions</dd></div>}<div><dt>Contact links selected</dt><dd>{item.contactClicks} of {item.trackedSessions} newer-tracker sessions</dd></div>{item.pageKey === "/about" && <div><dt>CV download selected</dt><dd>{item.cvClicks} of {item.trackedSessions} newer-tracker sessions</dd></div>}<div><dt>Sessions also recording a contact enquiry</dt><dd>{item.submissionSessions} of {item.trackedSessions} newer-tracker sessions</dd></div></>}
      </dl>
      <p>Scroll reach is not content consumption. Enquiries in the same session are observed alongside this page; they are not attributed to it. Recorded actions can be incomplete.</p>
      </details>
    </div>
  </details>;
}
function GroupRows({ group, titles, editLinks, range, journeyPage, selected }: { group: PerformanceGroup; titles: Record<string, string>; editLinks: Record<string, string>; range: OverviewRange; journeyPage: number; selected: boolean }) {
  return <><div className={styles.groupHeading}><strong>{labels[group.group]}</strong><span>{group.itemCount} {group.itemCount === 1 ? "page" : "pages"}</span></div>{group.items.map((item) => <Item key={item.pageKey} item={item} titles={titles} editLinks={editLinks} range={range} peers={group.items} />)}{!selected && group.itemCount > group.items.length && <Link className={styles.more} href={href(range, group.group, 1, journeyPage)}>View all {group.itemCount} pages <span aria-hidden="true">→</span></Link>}</>;
}
function TypeSummary({ groups }: { groups: PerformanceGroup[] }) {
  const largest = Math.max(0, ...groups.map((group) => group.engaged));
  return <div className={styles.typeList}>{groups.map((group) => <div className={styles.typeItem} key={group.group}><div><strong>{labels[group.group]}</strong><b>{group.engaged.toLocaleString()}</b></div>{largest >= 20 && <div className={styles.typeBar} aria-hidden="true"><i style={{ width: `${group.engaged / largest * 100}%` }} /></div>}<p>{group.itemCount} {group.itemCount === 1 ? "page" : "pages"} · Median {duration(group.medianAttention)}</p></div>)}</div>;
}
export function ContentPerformance({ data, range, titles, editLinks, journeyPage }: Props) {
  const { groups, selectedGroup, page, pageSize, total } = data;
  const pages = Math.ceil(total / pageSize);
  return <section className={styles.section} id="content-performance" aria-labelledby="content-performance-title">
    <div className={styles.layout}>
      <div className={styles.panel}>
        <header className={styles.header}><h2 id="content-performance-title">Content performance</h2><p>Likely-human sessions · ranked by engaged sessions within each type</p></header>
        <div className={styles.tabletTypes}><TypeSummary groups={groups} /></div>
        {selectedGroup && <div className={styles.filterInfo}><Link href={href(range, null, 1, journeyPage)}>← All content types</Link><span>{labels[selectedGroup]} · page {page} of {Math.max(1, pages)}</span></div>}
        {groups.length ? <>
          <div className={styles.desktopRows}><div className={styles.columns}><span>Title</span><span>Sessions</span><span>Engaged</span><span>Attention</span><span>Exposure</span><span>Deep</span><span /></div>{groups.map((group) => <GroupRows key={group.group} group={group} titles={titles} editLinks={editLinks} range={range} journeyPage={journeyPage} selected={Boolean(selectedGroup)} />)}</div>
          <div className={styles.mobileRows}>{groups.map((group, index) => <details className={styles.mobileGroup} key={group.group} open={index === 0 || Boolean(selectedGroup)}><summary><span><strong>{labels[group.group]}</strong><small>{group.engaged} engaged sessions · median {duration(group.medianAttention)}</small></span><ExpandIcon /></summary>{group.items.map((item) => <Item key={item.pageKey} item={item} titles={titles} editLinks={editLinks} range={range} peers={group.items} />)}{!selectedGroup && group.itemCount > group.items.length && <Link className={styles.more} href={href(range, group.group, 1, journeyPage)}>View all {group.itemCount} pages →</Link>}</details>)}</div>
          {selectedGroup && pages > 1 && <nav className={styles.pagination} aria-label={`${labels[selectedGroup]} performance pages`}><span>Page {page} of {pages}</span><div>{page > 1 && <Link href={href(range, selectedGroup, page - 1, journeyPage)}>← Previous</Link>}{page < pages && <Link href={href(range, selectedGroup, page + 1, journeyPage)}>Next →</Link>}</div></nav>}
        </> : <p className={styles.empty}>No likely-human page sessions are available for this period. New exposure measurements will appear after the updated tracker collects enough data.</p>}
        <p className={styles.note}>Sessions started in the selected period are included. Exposure is the average share of measurable sections that received at least five seconds of attentive visibility. Percentages require at least 20 measurable sessions; older visits have no exposure measurement.</p>
      </div>
      {groups.length > 0 && <aside className={styles.typePanel} aria-label="Content performance by type"><header><h3>By content type</h3><span>Engaged sessions</span></header><TypeSummary groups={groups} /><p>A session can appear in more than one type. Median attention is per page session.</p></aside>}
    </div>
  </section>;
}
