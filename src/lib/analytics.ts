import { db } from "@/lib/db";
import { createHmac, randomUUID } from "crypto";
import { getSessionSecret } from "@/lib/auth";

export type AnalyticsContentType = "case_study" | "article" | "cv";

export type VisitorContext = { source?: string; country?: string };

export type EngagementContentType = "home" | "work_index" | "case_study" | "articles_index" | "article" | "services_index" | "service" | "about" | "contact" | "page";
export type EngagementEventType = "page_view" | "interaction" | "attention" | "depth" | "chapter_view" | "action";
export type EngagementInputEvent = {
  eventId: string;
  type: EngagementEventType;
  pageKey: string;
  title?: string;
  contentType: EngagementContentType;
  contentId?: string;
  detail?: string;
  value?: number;
};

// Deterministic thresholds are intentionally centralized and content-aware.
export const ENGAGEMENT_RULES = {
  idleAfterSeconds: 45,
  checkpointSeconds: 20,
  exploreAttentionSeconds: 20,
  article: { engagedAttention: 60, engagedDepth: 50, deepAttention: 180, deepDepth: 90 },
  case_study: { engagedAttention: 90, engagedChapters: 3, deepAttention: 180, deepChapters: 4 },
  service: { engagedAttention: 45, engagedDepth: 60, deepAttention: 120, deepDepth: 75 },
  page: { engagedAttention: 45, engagedDepth: 50, deepAttention: 120, deepDepth: 75 },
} as const;

const VERIFIED_BOT_UA = /googlebot|googleother|google-extended|bingbot|duckduckbot|baiduspider|yandexbot|slurp|sogou|exabot|seznambot|applebot|facebookexternalhit|meta-externalagent|meta-externalfetcher|twitterbot|linkedinbot|slackbot|discordbot|whatsapp|telegrambot|gptbot|chatgpt-user|oai-searchbot|claudebot|anthropic-ai|perplexitybot|bytespider|ccbot|amazonbot|cohere-(?:ai|searchbot)|diffbot|ai2bot|petalbot|ahrefsbot|semrushbot|mj12bot|uptimerobot|pingdom|statuscake|site24x7|betterstack|checkly|datadog/i;

function levelRank(level: string) { return level === "deep" ? 3 : level === "engaged" ? 2 : level === "explored" ? 1 : 0; }
function maxLevel(...levels: string[]) { return levels.reduce((best, level) => levelRank(level) > levelRank(best) ? level : best, "visited"); }

function pageEngagement(page: { content_type: string; active_seconds: number; max_depth: number; chapter_count: number; interaction_count: number }) {
  const type = page.content_type;
  const isCase = type === "case_study";
  const isArticle = type === "article";
  const isService = type === "service";
  const rules: { engagedAttention: number; engagedDepth?: number; engagedChapters?: number; deepAttention: number; deepDepth?: number; deepChapters?: number } = isArticle ? ENGAGEMENT_RULES.article : isCase ? ENGAGEMENT_RULES.case_study : isService ? ENGAGEMENT_RULES.service : ENGAGEMENT_RULES.page;
  const explored = page.active_seconds >= ENGAGEMENT_RULES.exploreAttentionSeconds || page.max_depth >= 25 || page.interaction_count >= 1 || page.chapter_count >= 1;
  const engaged = isCase
    ? (page.active_seconds >= rules.engagedAttention && page.chapter_count >= (rules.engagedChapters ?? 0)) || (page.active_seconds >= 120 && page.max_depth >= 50)
    : isArticle
      ? (page.active_seconds >= rules.engagedAttention && page.max_depth >= (rules.engagedDepth ?? 0)) || (page.active_seconds >= 90 && page.max_depth >= 25)
      : isService
        ? (page.active_seconds >= rules.engagedAttention && page.max_depth >= (rules.engagedDepth ?? 0)) || (page.active_seconds >= 90 && page.interaction_count >= 1)
        : page.active_seconds >= rules.engagedAttention && page.max_depth >= (rules.engagedDepth ?? 0);
  const deep = isCase
    ? page.active_seconds >= rules.deepAttention && page.chapter_count >= (rules.deepChapters ?? 0)
    : isArticle
      ? page.active_seconds >= rules.deepAttention && page.max_depth >= (rules.deepDepth ?? 0)
      : isService
        ? page.active_seconds >= rules.deepAttention && page.max_depth >= (rules.deepDepth ?? 0) && page.interaction_count >= 1
        : page.active_seconds >= rules.deepAttention && page.max_depth >= (rules.deepDepth ?? 0);
  return deep ? "deep" : engaged ? "engaged" : explored ? "explored" : "visited";
}

function canonicalPageKey(value: string) {
  if (value.length > 220 || !value.startsWith("/") || value.startsWith("//") || value.includes("?") || value.includes("#")) return null;
  if (/[^\w\-/]/.test(value)) return null;
  return value;
}

/** Accept only derived, threshold-based events. Raw interaction streams are never stored. */
export function recordEngagementBatch(sessionId: string, events: EngagementInputEvent[], userAgent: string, source = "Direct") {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) return false;
  const verifiedBot = VERIFIED_BOT_UA.test(userAgent);
  const safeSource = ["Direct", "Google", "LinkedIn", "Other sources"].includes(source) ? source : "Other sources";
  db.exec("BEGIN IMMEDIATE;");
  try {
    db.prepare("INSERT OR IGNORE INTO engagement_sessions(session_id, actor_class, source) VALUES (?, ?, ?)").run(sessionId, verifiedBot ? "verified_bot" : "uncertain", safeSource);
    const insertEvent = db.prepare(`INSERT OR IGNORE INTO engagement_events(event_key, session_id, page_key, event_type, content_type, content_id, detail, value)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    const getSession = db.prepare("SELECT actor_class, started_at, interaction_count, page_count, active_seconds FROM engagement_sessions WHERE session_id = ?");
    const addSessionPage = db.prepare(`INSERT INTO engagement_pages(session_id, page_key, title, content_type, content_id)
      VALUES (?, ?, ?, ?, ?) ON CONFLICT(session_id, page_key) DO UPDATE SET last_seen_at = datetime('now'), title = CASE WHEN excluded.title <> '' THEN excluded.title ELSE engagement_pages.title END`);
    const updatePage = db.prepare(`UPDATE engagement_pages SET
      last_seen_at = datetime('now'),
      active_seconds = active_seconds + ?,
      max_depth = MAX(max_depth, ?),
      chapter_count = chapter_count + ?,
      interaction_count = interaction_count + ?,
      engagement_level = ?
      WHERE session_id = ? AND page_key = ?`);
    const validTypes = new Set<EngagementContentType>(["home", "work_index", "case_study", "articles_index", "article", "services_index", "service", "about", "contact", "page"]);
    for (const event of events.slice(0, 25)) {
      if (!event || typeof event.pageKey !== "string" || typeof event.eventId !== "string" || typeof event.type !== "string" || typeof event.contentType !== "string") continue;
      const pageKey = canonicalPageKey(event.pageKey);
      if (!pageKey || !validTypes.has(event.contentType) || !/^[0-9a-f-]{36}$/i.test(event.eventId)) continue;
      if (!( ["page_view", "interaction", "attention", "depth", "chapter_view", "action"] as string[]).includes(event.type)) continue;
      const contentId = (typeof event.contentId === "string" ? event.contentId : "").slice(0, 100);
      const detail = (typeof event.detail === "string" ? event.detail : "").replace(/[\r\n\u0000-\u001f]/g, " ").slice(0, 120);
      const value = Number.isFinite(event.value) ? Math.max(0, Math.min(event.type === "attention" ? 60 : 100, Math.floor(event.value || 0))) : 0;
      const existingPage = db.prepare("SELECT max_depth FROM engagement_pages WHERE session_id = ? AND page_key = ?").get(sessionId, pageKey) as { max_depth: number } | undefined;
      if (event.type === "depth" && existingPage && existingPage.max_depth >= value) continue;
      if (event.type === "chapter_view" && db.prepare("SELECT 1 FROM engagement_events WHERE session_id = ? AND page_key = ? AND event_type = 'chapter_view' AND detail = ? LIMIT 1").get(sessionId, pageKey, detail)) continue;
      const inserted = insertEvent.run(event.eventId, sessionId, pageKey, event.type, event.contentType, contentId, detail, value).changes > 0;
      if (!inserted) continue;
      addSessionPage.run(sessionId, pageKey, (typeof event.title === "string" ? event.title : "").slice(0, 180), event.contentType, contentId);
      const chapter = event.type === "chapter_view" ? 1 : 0;
      const interaction = event.type === "interaction" || event.type === "action" ? 1 : 0;
      const page = db.prepare("SELECT content_type, active_seconds, max_depth, chapter_count, interaction_count FROM engagement_pages WHERE session_id = ? AND page_key = ?").get(sessionId, pageKey) as { content_type: string; active_seconds: number; max_depth: number; chapter_count: number; interaction_count: number };
      updatePage.run(event.type === "attention" ? value : 0, event.type === "depth" ? value : 0, chapter, interaction, pageEngagement({ ...page, active_seconds: page.active_seconds + (event.type === "attention" ? value : 0), max_depth: Math.max(page.max_depth, event.type === "depth" ? value : 0), chapter_count: page.chapter_count + chapter, interaction_count: page.interaction_count + interaction }), sessionId, pageKey);
      if (event.type === "page_view") db.prepare("UPDATE engagement_sessions SET page_count = (SELECT COUNT(*) FROM engagement_pages WHERE session_id = ?), last_seen_at = datetime('now') WHERE session_id = ?").run(sessionId, sessionId);
      else db.prepare("UPDATE engagement_sessions SET last_seen_at = datetime('now'), interaction_count = interaction_count + ?, active_seconds = active_seconds + ? WHERE session_id = ?").run(interaction, event.type === "attention" ? value : 0, sessionId);
    }
    const session = getSession.get(sessionId) as { actor_class: string; started_at: string; interaction_count: number; page_count: number; active_seconds: number };
    const pageRows = db.prepare("SELECT * FROM engagement_pages WHERE session_id = ?").all(sessionId) as Array<{ content_type: string; active_seconds: number; max_depth: number; chapter_count: number; interaction_count: number; engagement_level: string; page_key: string }>;
    const elapsed = Math.max(0, Math.floor((Date.now() - Date.parse(`${session.started_at.replace(" ", "T")}Z`)) / 1000));
    let actor = verifiedBot ? "verified_bot" : session.actor_class;
    if (actor !== "verified_bot") {
      if (session.page_count >= 8 && elapsed < 15 && session.interaction_count === 0 && session.active_seconds === 0) actor = "likely_bot";
      // Any recorded pointer, keyboard, scroll, or explicit action is direct
      // evidence of user input. Attention time is only accumulated after such
      // input while the tab remains focused, so a modest attention threshold
      // is also useful for readers who do not continue interacting. A single
      // chapter observation is content-specific evidence of active reading.
      else if (session.interaction_count >= 1 || session.active_seconds >= 20 || pageRows.some((page) => page.chapter_count > 0)) actor = "likely_human";
    }
    const groups = new Set(pageRows.map((page) => page.content_type));
    let engagement = pageRows.reduce((level, page) => maxLevel(level, page.engagement_level), "visited");
    if (session.page_count >= 2 || session.active_seconds >= ENGAGEMENT_RULES.exploreAttentionSeconds || pageRows.some((page) => page.max_depth >= 25 || page.chapter_count > 0)) engagement = maxLevel(engagement, "explored");
    if ((groups.size >= 3 && session.active_seconds >= 60) || pageRows.some((page) => page.engagement_level === "engaged" || page.engagement_level === "deep")) engagement = maxLevel(engagement, "engaged");
    if ((groups.size >= 5 && session.page_count >= 5 && session.active_seconds >= 180) || pageRows.some((page) => page.engagement_level === "deep")) engagement = maxLevel(engagement, "deep");
    db.prepare("UPDATE engagement_sessions SET actor_class = ?, engagement_level = ?, duration_seconds = ?, last_seen_at = datetime('now') WHERE session_id = ?").run(actor, engagement, elapsed, sessionId);
    db.exec("COMMIT;");
    return true;
  } catch (error) {
    db.exec("ROLLBACK;");
    throw error;
  }
}

export type EngagementRange = "7d" | "30d" | "90d" | "all";
function rangeSql(range: EngagementRange, column = "s.started_at") { return range === "all" ? { clause: "", params: [] as string[] } : { clause: ` AND ${column} >= datetime('now', ?)`, params: [`-${range.slice(0, -1)} days`] }; }
const median = (values: number[]) => { if (!values.length) return null; const sorted = [...values].sort((a, b) => a - b); const mid = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2); };

export function getEngagementDashboardData(range: EngagementRange) {
  // Apply the more inclusive evidence rule to previously recorded uncertain
  // sessions too; otherwise only visits that send a future event would ever
  // benefit from the classifier update.
  db.prepare(`UPDATE engagement_sessions SET actor_class = 'likely_human'
    WHERE actor_class = 'uncertain' AND (
      interaction_count >= 1 OR active_seconds >= 20 OR
      session_id IN (SELECT session_id FROM engagement_pages WHERE chapter_count > 0)
    )`).run();
  const filter = rangeSql(range);
  const rows = db.prepare(`SELECT s.*, (SELECT COUNT(*) FROM engagement_pages p WHERE p.session_id=s.session_id) AS page_total FROM engagement_sessions s WHERE 1=1${filter.clause}`).all(...filter.params) as Array<{ session_id: string; actor_class: string; source: string; started_at: string; last_seen_at: string; page_count: number; interaction_count: number; active_seconds: number; duration_seconds: number; engagement_level: string; page_total: number }>;
  const human = rows.filter((row) => row.actor_class === "likely_human");
  const humanIds = human.map((row) => row.session_id);
  const portfolioGroups = humanIds.length ? db.prepare(`SELECT p.session_id, COUNT(DISTINCT p.content_type) AS groups_seen FROM engagement_pages p JOIN engagement_sessions s USING(session_id) WHERE s.actor_class='likely_human'${filter.clause} GROUP BY p.session_id`).all(...filter.params) as Array<{ session_id: string; groups_seen: number }> : [];
  const counts = { humans: human.length, explored: human.filter((row) => levelRank(row.engagement_level) >= 1).length, engaged: human.filter((row) => levelRank(row.engagement_level) >= 2).length, deep: human.filter((row) => levelRank(row.engagement_level) >= 3).length, portfolioExplorers: portfolioGroups.filter((row) => row.groups_seen >= 3).length, uncertain: rows.filter((row) => row.actor_class === "uncertain").length, likelyBot: rows.filter((row) => row.actor_class === "likely_bot").length, verifiedBot: rows.filter((row) => row.actor_class === "verified_bot").length };
  const contentPages = humanIds.length ? db.prepare(`SELECT p.*, s.engagement_level AS session_level FROM engagement_pages p JOIN engagement_sessions s USING(session_id) WHERE s.actor_class='likely_human'${filter.clause.replaceAll("s.started_at", "s.started_at")} ORDER BY p.last_seen_at DESC`).all(...filter.params) as Array<{ session_id: string; page_key: string; title: string; content_type: string; content_id: string; active_seconds: number; max_depth: number; chapter_count: number; engagement_level: string; session_level: string }> : [];
  const contentMap = new Map<string, { key: string; type: string; id: string; title: string; humans: number; explored: number; engaged: number; deep: number; attention: number[]; maxDepth: number; reachedEnd: number; onward: number; evidenceOpened: number; depth25: number; depth50: number; depth75: number; depth90: number }>();
  for (const page of contentPages) {
    const key = `${page.content_type}:${page.content_id || page.page_key}`;
    let item = contentMap.get(key);
    if (!item) { item = { key, type: page.content_type, id: page.content_id, title: page.title || page.page_key, humans: 0, explored: 0, engaged: 0, deep: 0, attention: [], maxDepth: 0, reachedEnd: 0, onward: 0, evidenceOpened: 0, depth25: 0, depth50: 0, depth75: 0, depth90: 0 }; contentMap.set(key, item); }
    item.humans += 1;
    if (levelRank(page.engagement_level) >= 1) item.explored += 1;
    if (levelRank(page.engagement_level) >= 2) item.engaged += 1;
    if (levelRank(page.engagement_level) >= 3) item.deep += 1;
    item.attention.push(page.active_seconds);
    item.maxDepth = Math.max(item.maxDepth, page.max_depth);
    if (page.max_depth >= 100) item.reachedEnd += 1;
    if (page.max_depth >= 25) item.depth25 += 1;
    if (page.max_depth >= 50) item.depth50 += 1;
    if (page.max_depth >= 75) item.depth75 += 1;
    if (page.max_depth >= 90) item.depth90 += 1;
  }
  const content = [...contentMap.values()].map((item) => ({ ...item, medianAttention: median(item.attention) })).sort((a, b) => b.humans - a.humans || a.title.localeCompare(b.title));
  for (const item of content) {
    const separator = item.key.indexOf(":");
    const pageKey = item.id
      ? `/${item.type === "case_study" ? "work" : item.type === "article" ? "insights" : item.type === "service" ? "services" : ""}/${item.id}`
      : separator >= 0 ? item.key.slice(separator + 1) : item.key;
    const filterClause = filter.clause.replace("s.started_at", "s.started_at");
    item.onward = (db.prepare(`SELECT COUNT(DISTINCT e.session_id) AS count FROM engagement_events e JOIN engagement_sessions s USING(session_id)
      WHERE s.actor_class='likely_human'${filterClause} AND e.event_type='page_view' AND e.page_key = ? AND EXISTS
      (SELECT 1 FROM engagement_events next WHERE next.session_id=e.session_id AND next.event_type='page_view' AND next.id>e.id AND next.page_key<>e.page_key)`).get(...filter.params, pageKey) as { count: number }).count;
    if (item.type === "service") item.evidenceOpened = (db.prepare(`SELECT COUNT(DISTINCT e.session_id) AS count FROM engagement_events e JOIN engagement_sessions s USING(session_id)
      WHERE s.actor_class='likely_human'${filterClause} AND e.event_type='action' AND e.detail='evidence_open' AND e.page_key = ?`).get(...filter.params, `/services/${item.id}`) as { count: number }).count;
  }
  const chapterRows = db.prepare(`SELECT e.content_id, e.detail, COUNT(DISTINCT e.session_id) AS count FROM engagement_events e JOIN engagement_sessions s USING(session_id) WHERE e.event_type='chapter_view' AND s.actor_class='likely_human'${filter.clause} GROUP BY e.content_id,e.detail ORDER BY e.content_id,e.detail`).all(...filter.params) as Array<{ content_id: string; detail: string; count: number }>;
  const journeySessions = human.filter((row) => row.page_total > 1 || row.engagement_level === "deep").sort((a, b) => b.started_at.localeCompare(a.started_at)).slice(0, 12);
  const journeys = journeySessions.map((session) => ({ source: session.source, engagement: session.engagement_level, started: session.started_at, duration: session.duration_seconds, pages: db.prepare("SELECT page_key, title, content_type, active_seconds, max_depth, chapter_count FROM engagement_pages WHERE session_id = ? ORDER BY id").all(session.session_id) as Array<{ page_key: string; title: string; content_type: string; active_seconds: number; max_depth: number; chapter_count: number }>, actions: db.prepare("SELECT detail FROM engagement_events WHERE session_id = ? AND event_type='action' ORDER BY id").all(session.session_id) as Array<{ detail: string }> }));
  const trackingStart = db.prepare("SELECT MIN(started_at) AS started FROM engagement_sessions").get() as { started: string | null };
  return { counts, content, chapters: chapterRows, journeys, trackingStart: trackingStart.started };
}

export function recordAnalyticsEvent(eventType: "view" | "share" | "download", contentType: AnalyticsContentType, contentId = "", context?: VisitorContext) {
  db.prepare("INSERT INTO analytics_events (event_type, content_type, content_id, source, country, event_key) VALUES (?, ?, ?, ?, ?, ?)").run(eventType, contentType, contentId, context?.source ?? "", context?.country ?? "", randomUUID());
}

export function recordUniqueView(contentType: "article" | "case_study", contentId: string, visitorId: string, context?: VisitorContext) {
  const visitorHash = createHmac("sha256", getSessionSecret()).update(visitorId).digest("hex");
  const existing = db.prepare(`SELECT 1 FROM analytics_events WHERE event_type = 'view' AND content_type = ? AND content_id = ? AND visitor_hash = ? AND created_at >= datetime('now', '-30 days') LIMIT 1`).get(contentType, contentId, visitorHash);
  if (existing) return false;
  db.prepare("INSERT INTO analytics_events (event_type, content_type, content_id, source, country, visitor_hash, event_key) VALUES ('view', ?, ?, ?, ?, ?, ?)").run(contentType, contentId, context?.source ?? "", context?.country ?? "", visitorHash, randomUUID());
  return true;
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

export function getAnalyticsCountPeriod(contentType: AnalyticsContentType, eventTypes: string[], startDaysAgo: number, endDaysAgo = 0) {
  const placeholders = eventTypes.map(() => "?").join(", ");
  const row = db.prepare(`SELECT COUNT(*) AS count FROM analytics_events WHERE content_type = ? AND event_type IN (${placeholders}) AND created_at >= datetime('now', ?) AND created_at < datetime('now', ?)`).get(contentType, ...eventTypes, `-${startDaysAgo} days`, `-${endDaysAgo} days`) as { count: number };
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
