import type { DatabaseSync } from "node:sqlite";

export type ValueEvidence = { type: "case_study" | "article"; id: number };
export type ValueProposition = { title: string; description: string; evidence: ValueEvidence | null };
export type ValueEvidenceOption = { id: number; type: ValueEvidence["type"]; title: string; href: string };

export function parseValueContent(raw: string): ValueProposition[] {
  let items: unknown = [];
  try { items = (JSON.parse(raw || "{}") as { propositions?: unknown }).propositions; } catch { /* Empty or invalid content is editable. */ }
  return Array.from({ length: 3 }, (_, index) => {
    const item = Array.isArray(items) && items[index] && typeof items[index] === "object" ? items[index] : {};
    const candidate = item.evidence;
    const evidence = candidate && (candidate.type === "case_study" || candidate.type === "article") && Number.isSafeInteger(candidate.id) && candidate.id > 0 ? { type: candidate.type, id: candidate.id } as ValueEvidence : null;
    return { title: typeof item.title === "string" ? item.title : "", description: typeof item.description === "string" ? item.description : "", evidence };
  });
}

/** Resolve only currently published and publicly accessible evidence. */
export function readValueEvidenceOptions(db: DatabaseSync, now: string, includeInsights = true): ValueEvidenceOption[] {
  const studies = db.prepare("SELECT id, slug, title FROM case_studies WHERE published = 1 AND password_required = 0 ORDER BY position, id").all() as Array<{ id: number; slug: string; title: string }>;
  const hasInsights = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='insights'").get();
  const articles = includeInsights && hasInsights ? db.prepare("SELECT id, slug, title FROM insights WHERE published = 1 AND (scheduled_at = '' OR scheduled_at <= ?) ORDER BY position, id").all(now) as Array<{ id: number; slug: string; title: string }> : [];
  return [...studies.map((item) => ({ id: item.id, type: "case_study" as const, title: item.title, href: `/work/${encodeURIComponent(item.slug)}` })), ...articles.map((item) => ({ id: item.id, type: "article" as const, title: item.title, href: `/insights/${encodeURIComponent(item.slug)}` }))];
}
