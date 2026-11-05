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
export function getEngagementDashboardData(range: EngagementRange, options: { contentPage?: number; journeyPage?: number } = {}) {
  const filter = rangeSql(range);
  const includedFilter = rangeSql(range);
  const summary = db.prepare(`SELECT
    SUM(CASE WHEN actor_class IN ('likely_human','uncertain') THEN 1 ELSE 0 END) AS humans,
    SUM(CASE WHEN actor_class IN ('likely_human','uncertain') AND engagement_level IN ('explored','engaged','deep') THEN 1 ELSE 0 END) AS explored,
    SUM(CASE WHEN actor_class IN ('likely_human','uncertain') AND engagement_level IN ('engaged','deep') THEN 1 ELSE 0 END) AS engaged,
    SUM(CASE WHEN actor_class IN ('likely_human','uncertain') AND engagement_level = 'deep' THEN 1 ELSE 0 END) AS deep,
    SUM(CASE WHEN actor_class = 'uncertain' THEN 1 ELSE 0 END) AS uncertain,
    SUM(CASE WHEN actor_class = 'likely_bot' THEN 1 ELSE 0 END) AS likelyBot,
    SUM(CASE WHEN actor_class = 'verified_bot' THEN 1 ELSE 0 END) AS verifiedBot
    FROM engagement_sessions s WHERE 1=1${filter.clause}`).get(...filter.params) as { humans: number; explored: number; engaged: number; deep: number; uncertain: number; likelyBot: number; verifiedBot: number };
  const portfolioExplorers = (db.prepare(`SELECT COUNT(*) AS count FROM (
    SELECT p.session_id FROM engagement_pages p JOIN engagement_sessions s USING(session_id)
    WHERE s.actor_class IN ('likely_human','uncertain')${includedFilter.clause}
    GROUP BY p.session_id HAVING COUNT(DISTINCT p.content_type) >= 3
  )`).get(...includedFilter.params) as { count: number }).count;
  const counts = { ...summary, humans: summary.humans || 0, explored: summary.explored || 0, engaged: summary.engaged || 0, deep: summary.deep || 0, uncertain: summary.uncertain || 0, likelyBot: summary.likelyBot || 0, verifiedBot: summary.verifiedBot || 0, portfolioExplorers };
  const contentPageSize = 10;
  const requestedContentPage = Math.max(1, Math.min(1_000_000, Math.floor(options.contentPage || 1)));
  const contentTotal = (db.prepare(`SELECT COUNT(*) AS total FROM (
    SELECT p.content_type, COALESCE(NULLIF(p.content_id,''), p.page_key) FROM engagement_pages p
    JOIN engagement_sessions s USING(session_id) WHERE s.actor_class IN ('likely_human','uncertain')${filter.clause}
    GROUP BY p.content_type, COALESCE(NULLIF(p.content_id,''), p.page_key)
  )`).get(...filter.params) as { total: number }).total;
  const contentPage = Math.min(requestedContentPage, Math.max(1, Math.ceil(contentTotal / contentPageSize)));
  const contentOffset = (contentPage - 1) * contentPageSize;
  const content = db.prepare(`WITH ranked AS (
    SELECT p.session_id, p.page_key, p.title, p.content_type, p.content_id, p.active_seconds, p.max_depth, p.chapter_count, p.engagement_level, p.last_seen_at,
      p.content_type || ':' || COALESCE(NULLIF(p.content_id,''), p.page_key) AS item_key,
      ROW_NUMBER() OVER (PARTITION BY p.content_type, COALESCE(NULLIF(p.content_id,''), p.page_key) ORDER BY p.active_seconds) AS attention_rank,
      COUNT(*) OVER (PARTITION BY p.content_type, COALESCE(NULLIF(p.content_id,''), p.page_key)) AS item_count,
      ROW_NUMBER() OVER (PARTITION BY p.content_type, COALESCE(NULLIF(p.content_id,''), p.page_key) ORDER BY p.last_seen_at DESC, p.id DESC) AS newest_rank
    FROM engagement_pages p JOIN engagement_sessions s USING(session_id)
    WHERE s.actor_class IN ('likely_human','uncertain')${filter.clause}
  ), aggregated AS (
    SELECT item_key AS key, content_type AS type, MAX(content_id) AS id,
      MAX(CASE WHEN newest_rank=1 THEN COALESCE(NULLIF(title,''), page_key) END) AS title,
      COUNT(*) AS humans,
      SUM(CASE WHEN engagement_level IN ('explored','engaged','deep') THEN 1 ELSE 0 END) AS explored,
      SUM(CASE WHEN engagement_level IN ('engaged','deep') THEN 1 ELSE 0 END) AS engaged,
      SUM(CASE WHEN engagement_level='deep' THEN 1 ELSE 0 END) AS deep,
      MAX(max_depth) AS maxDepth,
      SUM(CASE WHEN max_depth >= 100 THEN 1 ELSE 0 END) AS reachedEnd,
      SUM(CASE WHEN max_depth >= 25 THEN 1 ELSE 0 END) AS depth25,
      SUM(CASE WHEN max_depth >= 50 THEN 1 ELSE 0 END) AS depth50,
      SUM(CASE WHEN max_depth >= 75 THEN 1 ELSE 0 END) AS depth75,
      SUM(CASE WHEN max_depth >= 90 THEN 1 ELSE 0 END) AS depth90,
      ROUND(AVG(CASE WHEN attention_rank IN (CAST((item_count+1)/2 AS INTEGER), CAST((item_count+2)/2 AS INTEGER)) THEN active_seconds END)) AS medianAttention
    FROM ranked GROUP BY item_key, content_type, COALESCE(NULLIF(content_id,''), page_key)
  ) SELECT * FROM aggregated ORDER BY humans DESC, title ASC LIMIT ? OFFSET ?`).all(...filter.params, contentPageSize, contentOffset) as Array<{ key: string; type: string; id: string; title: string; humans: number; explored: number; engaged: number; deep: number; maxDepth: number; reachedEnd: number; depth25: number; depth50: number; depth75: number; depth90: number; medianAttention: number | null; onward: number; evidenceOpened: number }>;
  for (const item of content) { item.onward = 0; item.evidenceOpened = 0; }
  for (const item of content) {
    const separator = item.key.indexOf(":");
    const pageKey = item.id
      ? `/${item.type === "case_study" ? "work" : item.type === "article" ? "insights" : item.type === "service" ? "services" : ""}/${item.id}`
      : separator >= 0 ? item.key.slice(separator + 1) : item.key;
    const filterClause = filter.clause.replace("s.started_at", "s.started_at");
    item.onward = (db.prepare(`SELECT COUNT(DISTINCT e.session_id) AS count FROM engagement_events e JOIN engagement_sessions s USING(session_id)
      WHERE s.actor_class IN ('likely_human','uncertain')${filterClause} AND e.event_type='page_view' AND e.page_key = ? AND EXISTS
      (SELECT 1 FROM engagement_events next WHERE next.session_id=e.session_id AND next.event_type='page_view' AND next.id>e.id AND next.page_key<>e.page_key)`).get(...filter.params, pageKey) as { count: number }).count;
    if (item.type === "service") item.evidenceOpened = (db.prepare(`SELECT COUNT(DISTINCT e.session_id) AS count FROM engagement_events e JOIN engagement_sessions s USING(session_id)
      WHERE s.actor_class IN ('likely_human','uncertain')${filterClause} AND e.event_type='action' AND e.detail='evidence_open' AND e.page_key = ?`).get(...filter.params, `/services/${item.id}`) as { count: number }).count;
  }
  const chapterRows = db.prepare(`SELECT e.content_id, e.detail, COUNT(DISTINCT e.session_id) AS count FROM engagement_events e JOIN engagement_sessions s USING(session_id) WHERE e.event_type='chapter_view' AND s.actor_class IN ('likely_human','uncertain')${filter.clause} GROUP BY e.content_id,e.detail ORDER BY e.content_id,e.detail`).all(...filter.params) as Array<{ content_id: string; detail: string; count: number }>;
  const journeyPageSize = 10;
  const requestedJourneyPage = Math.max(1, Math.min(1_000_000, Math.floor(options.journeyPage || 1)));
  const journeyCondition = " AND ((SELECT COUNT(*) FROM engagement_pages p WHERE p.session_id=s.session_id) > 1 OR s.engagement_level='deep')";
  const journeyTotal = (db.prepare(`SELECT COUNT(*) AS total FROM engagement_sessions s WHERE s.actor_class IN ('likely_human','uncertain')${filter.clause}${journeyCondition}`).get(...filter.params) as { total: number }).total;
  const journeyPage = Math.min(requestedJourneyPage, Math.max(1, Math.ceil(journeyTotal / journeyPageSize)));
  const journeyOffset = (journeyPage - 1) * journeyPageSize;
  const journeySessions = db.prepare(`SELECT s.session_id, s.source, s.engagement_level, s.started_at, s.duration_seconds FROM engagement_sessions s WHERE s.actor_class IN ('likely_human','uncertain')${filter.clause}${journeyCondition} ORDER BY s.started_at DESC LIMIT ? OFFSET ?`).all(...filter.params, journeyPageSize, journeyOffset) as Array<{ session_id: string; source: string; engagement_level: string; started_at: string; duration_seconds: number }>;
  const journeys = journeySessions.map((session) => {
    const pageCount = (db.prepare("SELECT COUNT(*) AS count FROM engagement_pages WHERE session_id = ?").get(session.session_id) as { count: number }).count;
    const actionCount = (db.prepare("SELECT COUNT(*) AS count FROM engagement_events WHERE session_id = ? AND event_type='action'").get(session.session_id) as { count: number }).count;
    return {
      source: session.source,
      engagement: session.engagement_level,
      started: session.started_at,
      duration: session.duration_seconds,
      pageCount,
      actionCount,
      pages: db.prepare("SELECT page_key, title, content_type, active_seconds, max_depth, chapter_count FROM engagement_pages WHERE session_id = ? ORDER BY id LIMIT 50").all(session.session_id) as Array<{ page_key: string; title: string; content_type: string; active_seconds: number; max_depth: number; chapter_count: number }>,
      actions: db.prepare("SELECT detail FROM engagement_events WHERE session_id = ? AND event_type='action' ORDER BY id DESC LIMIT 30").all(session.session_id).reverse() as Array<{ detail: string }>,
    };
  });
  const trackingStart = db.prepare("SELECT MIN(started_at) AS started FROM engagement_sessions").get() as { started: string | null };
  return { counts, content, contentPage, contentPageSize, contentTotal, chapters: chapterRows, journeys, journeyPage, journeyPageSize, journeyTotal, trackingStart: trackingStart.started };
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
