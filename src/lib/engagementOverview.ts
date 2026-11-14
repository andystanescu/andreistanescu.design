import type { DatabaseSync } from "node:sqlite";

export type OverviewRange = "7d" | "30d" | "90d" | "all";
export type OverviewCounts = { sessions: number; engaged: number; deep: number; pageViews: number; enquiries: number };
export type EngagementOverview = { current: OverviewCounts; previous: OverviewCounts | null; trackingStart: string | null; comparisonAvailable: boolean };

/** Count tab-scoped, currently classified likely-human sessions and accepted enquiries independently. */
export function readEngagementOverview(db: DatabaseSync, range: OverviewRange, now = new Date()): EngagementOverview {
  const timestamp = now.toISOString();
  const days = range === "all" ? null : Number(range.slice(0, -1));
  const window = (start: number | null, end: number | null): OverviewCounts => {
    const sessionTime = start === null ? "" : " AND s.started_at >= datetime(?, ?) AND s.started_at < datetime(?, ?)";
    const submissionTime = start === null ? "" : " AND created_at >= datetime(?, ?) AND created_at < datetime(?, ?)";
    const params = start === null ? [] : [timestamp, `-${start} days`, timestamp, end === 0 ? "+0 days" : `-${end} days`];
    const session = db.prepare(`SELECT COUNT(*) AS sessions,
      COALESCE(SUM(CASE WHEN s.engagement_level IN ('engaged','deep') THEN 1 ELSE 0 END), 0) AS engaged,
      COALESCE(SUM(CASE WHEN s.engagement_level = 'deep' THEN 1 ELSE 0 END), 0) AS deep
      FROM engagement_sessions s WHERE s.actor_class = 'likely_human'${sessionTime}`).get(...params) as { sessions: number; engaged: number; deep: number };
    const views = db.prepare(`SELECT COUNT(*) AS pageViews FROM engagement_events e JOIN engagement_sessions s ON s.session_id = e.session_id
      WHERE s.actor_class = 'likely_human' AND e.event_type = 'page_view'${sessionTime}`).get(...params) as { pageViews: number };
    const enquiries = db.prepare(`SELECT COUNT(*) AS count FROM submissions WHERE blocked = 0${submissionTime}`).get(...params) as { count: number };
    return { ...session, pageViews: views.pageViews, enquiries: enquiries.count };
  };
  const current = window(days, 0);
  const previous = days === null ? null : window(days * 2, days);
  const trackingStart = (db.prepare("SELECT MIN(started_at) AS started FROM engagement_sessions").get() as { started: string | null }).started;
  const first = trackingStart ? Date.parse(`${trackingStart.replace(" ", "T")}Z`) : NaN;
  // Different measurement rules do not make a comparable trend. Existing
  // sessions keep their original version; do not silently reclassify them.
  const hasVersion = (db.prepare("PRAGMA table_info(engagement_sessions)").all() as Array<{ name: string }>).some((column) => column.name === "measurement_version");
  let comparableRules = true;
  if (hasVersion && days) {
    const versions = db.prepare(`SELECT DISTINCT measurement_version AS version FROM engagement_sessions WHERE actor_class='likely_human' AND started_at >= datetime(?, ?) AND started_at < datetime(?, '+0 days')`).all(timestamp, `-${days * 2} days`) as Array<{ version: number }>;
    comparableRules = versions.length === 1;
  }
  const comparisonAvailable = Boolean(previous && days && comparableRules && Number.isFinite(first) && first <= now.getTime() - days * 2 * 86_400_000 && current.sessions >= 20 && previous.sessions >= 20);
  return { current, previous, trackingStart, comparisonAvailable };
}

export function overviewShare(numerator: number, denominator: number): number | null {
  return denominator >= 20 ? Math.round((numerator / denominator) * 100) : null;
}
