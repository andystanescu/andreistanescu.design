import { db } from "@/lib/db";

export type AnalyticsContentType = "case_study" | "article" | "cv";

export type VisitorContext = { source?: string; country?: string };

export function recordAnalyticsEvent(eventType: "view" | "share" | "download", contentType: AnalyticsContentType, contentId = "", context?: VisitorContext) {
  db.prepare("INSERT INTO analytics_events (event_type, content_type, content_id, source, country) VALUES (?, ?, ?, ?, ?)").run(eventType, contentType, contentId, context?.source ?? "", context?.country ?? "");
}

export function getAnalyticsCount(contentType: AnalyticsContentType, eventTypes: string[] = ["view", "share"], contentId?: string) {
  const placeholders = eventTypes.map(() => "?").join(", ");
  const suffix = contentId === undefined ? "" : " AND content_id = ?";
  const values = contentId === undefined ? [contentType, ...eventTypes] : [contentType, ...eventTypes, contentId];
  const row = db.prepare(`SELECT COUNT(*) AS count FROM analytics_events WHERE content_type = ? AND event_type IN (${placeholders})${suffix}`).get(...values) as { count: number };
  return row.count;
}

export function getAnalyticsCountSince(contentType: AnalyticsContentType, eventTypes: string[] = ["view", "share"], days = 30) {
  const placeholders = eventTypes.map(() => "?").join(", ");
  const row = db.prepare(`SELECT COUNT(*) AS count FROM analytics_events WHERE content_type = ? AND event_type IN (${placeholders}) AND created_at >= datetime('now', ?)`).get(contentType, ...eventTypes, `-${days} days`) as { count: number };
  return row.count;
}

export function getVisitorBreakdown(days = 30) {
  const rows = db.prepare(`SELECT source, country, COUNT(*) AS count FROM analytics_events WHERE event_type = 'view' AND content_type IN ('case_study', 'article') AND created_at >= datetime('now', ?) GROUP BY source, country`).all(`-${days} days`) as Array<{ source: string; country: string; count: number }>;
  const sources = { Direct: 0, Google: 0, LinkedIn: 0, "Other sources": 0 };
  const countries = new Map<string, number>();
  for (const row of rows) {
    const source = row.source === "Google" || row.source === "LinkedIn" || row.source === "Direct" ? row.source : "Other sources";
    sources[source] += row.count;
    const code = row.country.trim();
    if (code) {
      let name = code;
      try { name = new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code; } catch { /* keep the provider's country code */ }
      countries.set(name, (countries.get(name) ?? 0) + row.count);
    }
  }
  const sorted = [...countries.entries()].sort((a, b) => b[1] - a[1]);
  const topCountries = sorted.slice(0, 3);
  const other = sorted.slice(3).reduce((total, [, count]) => total + count, 0);
  return { sources, countries: [...topCountries, ...(other ? [["Other", other] as [string, number]] : [])] };
}

export function visitorContextFromHeaders(headers: Headers): VisitorContext {
  const referrer = headers.get("referer") ?? "";
  let source = "Direct";
  try {
    const hostname = referrer ? new URL(referrer).hostname.toLowerCase() : "";
    if (hostname.includes("google.")) source = "Google";
    else if (hostname.includes("linkedin.")) source = "LinkedIn";
    else if (hostname) source = "Other sources";
  } catch { source = "Other sources"; }
  return { source, country: (headers.get("cf-ipcountry") ?? headers.get("x-vercel-ip-country") ?? headers.get("x-country") ?? "").toUpperCase() };
}
