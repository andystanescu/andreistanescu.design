import type { DatabaseSync } from "node:sqlite";

/** Attach category-only imports after their referenced study becomes available. */
export function applyPendingCategoryAssignments(db: DatabaseSync, studyId: number, slug: string) {
  const pending = db.prepare("SELECT category_id FROM pending_case_study_categories WHERE study_slug = ? ORDER BY position, category_id").all(slug) as Array<{ category_id: number }>;
  if (!pending.length) return 0;
  const next = db.prepare("SELECT COALESCE(MAX(position), -1) + 1 AS position FROM case_study_categories WHERE case_study_id = ?").get(studyId) as { position: number };
  const add = db.prepare("INSERT OR IGNORE INTO case_study_categories(case_study_id, category_id, position) VALUES (?, ?, ?)");
  pending.forEach(({ category_id }, index) => add.run(studyId, category_id, next.position + index));
  db.prepare("UPDATE case_studies SET category = COALESCE((SELECT c.name FROM case_study_categories sc JOIN categories c ON c.id = sc.category_id WHERE sc.case_study_id = ? ORDER BY sc.position, sc.category_id LIMIT 1), '') WHERE id = ?").run(studyId, studyId);
  db.prepare("DELETE FROM pending_case_study_categories WHERE study_slug = ?").run(slug);
  return pending.length;
}
