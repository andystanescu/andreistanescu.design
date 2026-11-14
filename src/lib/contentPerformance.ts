import type { DatabaseSync } from "node:sqlite";
import type { OverviewRange } from "./engagementOverview";

export const CONTENT_GROUPS = ["case_study", "article", "service", "general"] as const;
export type ContentGroup = (typeof CONTENT_GROUPS)[number];
export type PerformanceItem = { group: ContentGroup; pageKey: string; contentType: string; contentId: string; title: string; sessions: number; engaged: number; deep: number; medianAttention: number | null; depth25: number; depth50: number; depth75: number; depth90: number; reachedEnd: number; exposurePercent: number | null; measuredSessions: number; outcomeMeasured: number; outcomesReached: number; returns: number; trackedSessions: number; onward: number; evidenceOpened: number; relatedOpened: number; contactClicks: number; cvClicks: number; submissionSessions: number };
export type PerformanceGroup = { group: ContentGroup; itemCount: number; sessions: number; engaged: number; medianAttention: number | null; items: PerformanceItem[] };
export type ContentPerformanceData = { groups: PerformanceGroup[]; selectedGroup: ContentGroup | null; page: number; pageSize: number; total: number };

const GROUP_CASE = `CASE WHEN p.content_type IN ('case_study','article','service') THEN p.content_type ELSE 'general' END`;

/** Rank page-level engagement within each type, excluding uncertain and automated sessions. */
export function readContentPerformance(db: DatabaseSync, range: OverviewRange, options: { group?: string; page?: number } = {}): ContentPerformanceData {
  const selectedGroup = CONTENT_GROUPS.find((group) => group === options.group) ?? null;
  const timeClause = range === "all" ? "" : " AND s.started_at >= datetime('now', ?)";
  const params = range === "all" ? [] : [`-${range.slice(0, -1)} days`];
  const base = `SELECT p.session_id, p.page_key, p.title, p.content_type, p.content_id, p.active_seconds, p.max_depth, p.engagement_level, p.last_seen_at, p.id, s.measurement_version, ${GROUP_CASE} AS content_group
    FROM engagement_pages p JOIN engagement_sessions s ON s.session_id=p.session_id
    WHERE s.actor_class='likely_human'${timeClause}`;
  const summaries = db.prepare(`WITH base AS (${base}), ranked AS (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY content_group ORDER BY active_seconds) AS attention_rank,
      COUNT(*) OVER (PARTITION BY content_group) AS attention_count FROM base
    ) SELECT content_group AS contentGroup, COUNT(DISTINCT page_key) AS itemCount,
      COUNT(DISTINCT session_id) AS sessions,
      COUNT(DISTINCT CASE WHEN engagement_level IN ('engaged','deep') THEN session_id END) AS engaged,
      ROUND(AVG(CASE WHEN attention_rank IN (CAST((attention_count+1)/2 AS INTEGER), CAST((attention_count+2)/2 AS INTEGER)) THEN active_seconds END)) AS medianAttention
    FROM ranked GROUP BY content_group`).all(...params) as Array<{ contentGroup: ContentGroup; itemCount: number; sessions: number; engaged: number; medianAttention: number | null }>;

  const selectedSummary = summaries.find((summary) => summary.contentGroup === selectedGroup);
  const total = selectedSummary?.itemCount ?? 0;
  const pageSize = 10;
  const requestedPage = Math.max(1, Math.min(1_000_000, Math.floor(options.page || 1)));
  const page = selectedGroup ? Math.min(requestedPage, Math.max(1, Math.ceil(total / pageSize))) : 1;
  const first = selectedGroup ? (page - 1) * pageSize + 1 : 1;
  const last = selectedGroup ? page * pageSize : 3;
  const groupFilter = selectedGroup ? "AND content_group = ?" : "";
  const items = db.prepare(`WITH base AS (${base}), exposure AS (
      SELECT session_id, page_key, MAX(CASE WHEN event_type='exposure_ready' THEN value ELSE 0 END) AS eligible,
        MAX(CASE WHEN event_type='exposure_ready' AND detail='v2_outcomes' THEN 1 ELSE 0 END) AS outcomeMeasured,
        COUNT(DISTINCT CASE WHEN event_type='exposure_attended' THEN detail END) AS attended,
        MAX(CASE WHEN event_type='exposure_seen' AND detail='outcomes' THEN 1 ELSE 0 END) AS outcomesReached,
        MAX(CASE WHEN event_type='exposure_return' THEN 1 ELSE 0 END) AS returned
      FROM engagement_events WHERE event_type IN ('exposure_ready','exposure_attended','exposure_seen','exposure_return') GROUP BY session_id, page_key
    ), ranked_attention AS (
      SELECT base.*, COALESCE(exposure.eligible, 0) AS eligible, COALESCE(exposure.attended, 0) AS attended,
      COALESCE(exposure.outcomeMeasured, 0) AS outcomeMeasured, COALESCE(exposure.outcomesReached, 0) AS outcomesReached, COALESCE(exposure.returned, 0) AS returned,
      ROW_NUMBER() OVER (PARTITION BY base.content_group, base.page_key ORDER BY base.active_seconds) AS attention_rank,
      COUNT(*) OVER (PARTITION BY base.content_group, base.page_key) AS attention_count,
      ROW_NUMBER() OVER (PARTITION BY base.content_group, base.page_key ORDER BY base.last_seen_at DESC, base.id DESC) AS newest_rank FROM base LEFT JOIN exposure ON exposure.session_id=base.session_id AND exposure.page_key=base.page_key
    ), aggregated AS (
      SELECT content_group AS contentGroup, page_key AS pageKey, MAX(content_type) AS contentType, MAX(content_id) AS contentId,
        MAX(CASE WHEN newest_rank=1 THEN title END) AS title, COUNT(DISTINCT session_id) AS sessions,
        COUNT(DISTINCT CASE WHEN engagement_level IN ('engaged','deep') THEN session_id END) AS engaged,
        COUNT(DISTINCT CASE WHEN engagement_level='deep' THEN session_id END) AS deep,
        ROUND(AVG(CASE WHEN attention_rank IN (CAST((attention_count+1)/2 AS INTEGER), CAST((attention_count+2)/2 AS INTEGER)) THEN active_seconds END)) AS medianAttention,
        SUM(CASE WHEN max_depth >= 25 THEN 1 ELSE 0 END) AS depth25, SUM(CASE WHEN max_depth >= 50 THEN 1 ELSE 0 END) AS depth50,
        SUM(CASE WHEN max_depth >= 75 THEN 1 ELSE 0 END) AS depth75, SUM(CASE WHEN max_depth >= 90 THEN 1 ELSE 0 END) AS depth90,
        SUM(CASE WHEN max_depth >= 100 THEN 1 ELSE 0 END) AS reachedEnd,
        COUNT(DISTINCT CASE WHEN eligible > 0 THEN session_id END) AS measuredSessions,
        ROUND(AVG(CASE WHEN eligible > 0 THEN 100.0 * MIN(attended, eligible) / eligible END)) AS exposurePercent,
        SUM(CASE WHEN outcomeMeasured > 0 THEN 1 ELSE 0 END) AS outcomeMeasured, SUM(CASE WHEN outcomesReached > 0 THEN 1 ELSE 0 END) AS outcomesReached,
        SUM(CASE WHEN returned > 0 THEN 1 ELSE 0 END) AS returns,
        COUNT(DISTINCT CASE WHEN measurement_version >= 2 THEN session_id END) AS trackedSessions
      FROM ranked_attention GROUP BY content_group, page_key
    ), numbered AS (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY contentGroup ORDER BY engaged DESC, sessions DESC, pageKey ASC) AS item_rank FROM aggregated
    ) SELECT * FROM numbered WHERE item_rank BETWEEN ? AND ? ${groupFilter.replace("content_group", "contentGroup")} ORDER BY contentGroup, item_rank`).all(...params, first, last, ...(selectedGroup ? [selectedGroup] : [])) as Array<Omit<PerformanceItem, "group" | "onward" | "evidenceOpened" | "relatedOpened" | "contactClicks" | "cvClicks" | "submissionSessions"> & { contentGroup: ContentGroup }>;

  const pageKeys = items.map((item) => item.pageKey);
  const signals = pageKeys.length ? db.prepare(`SELECT e.page_key AS pageKey,
    COUNT(DISTINCT CASE WHEN e.event_type='page_view' AND EXISTS (SELECT 1 FROM engagement_events later WHERE later.session_id=e.session_id AND later.event_type='page_view' AND later.id>e.id AND later.page_key<>e.page_key) THEN e.session_id END) AS onward,
    COUNT(DISTINCT CASE WHEN s.measurement_version>=2 AND e.event_type='action' AND e.detail='evidence_open' THEN e.session_id END) AS evidenceOpened,
    COUNT(DISTINCT CASE WHEN s.measurement_version>=2 AND e.event_type='action' AND e.detail='related_open' THEN e.session_id END) AS relatedOpened,
    COUNT(DISTINCT CASE WHEN s.measurement_version>=2 AND e.event_type='navigation' AND e.detail='/contact' THEN e.session_id END) AS contactClicks,
    COUNT(DISTINCT CASE WHEN s.measurement_version>=2 AND e.event_type='action' AND e.detail='cv_download' THEN e.session_id END) AS cvClicks,
    COUNT(DISTINCT CASE WHEN s.measurement_version>=2 AND EXISTS (SELECT 1 FROM engagement_events conversion WHERE conversion.session_id=e.session_id AND conversion.event_type='action' AND conversion.detail='contact_submission') THEN e.session_id END) AS submissionSessions
    FROM engagement_events e JOIN engagement_sessions s ON s.session_id=e.session_id WHERE s.actor_class='likely_human'${timeClause} AND e.page_key IN (${pageKeys.map(() => "?").join(",")}) GROUP BY e.page_key`).all(...params, ...pageKeys) as Array<{ pageKey: string; onward: number; evidenceOpened: number; relatedOpened: number; contactClicks: number; cvClicks: number; submissionSessions: number }> : [];
  const byKey = new Map(signals.map((signal) => [signal.pageKey, signal]));
  const groups = CONTENT_GROUPS.flatMap((group) => {
    const summary = summaries.find((entry) => entry.contentGroup === group);
    if (!summary || (selectedGroup && group !== selectedGroup)) return [];
    return [{ group, itemCount: summary.itemCount, sessions: summary.sessions, engaged: summary.engaged, medianAttention: summary.medianAttention,
      items: items.filter((item) => item.contentGroup === group).map(({ contentGroup, ...item }) => ({ ...item, group: contentGroup, onward: byKey.get(item.pageKey)?.onward ?? 0, evidenceOpened: byKey.get(item.pageKey)?.evidenceOpened ?? 0, relatedOpened: byKey.get(item.pageKey)?.relatedOpened ?? 0, contactClicks: byKey.get(item.pageKey)?.contactClicks ?? 0, cvClicks: byKey.get(item.pageKey)?.cvClicks ?? 0, submissionSessions: byKey.get(item.pageKey)?.submissionSessions ?? 0 })) }];
  });
  return { groups, selectedGroup, page, pageSize, total };
}
