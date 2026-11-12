import type { DatabaseSync } from "node:sqlite";

/** Caller owns the transaction. Case studies and articles themselves are retained. */
export function deleteCategory(db: DatabaseSync, categoryId: number) {
  const category = db.prepare("SELECT id FROM categories WHERE id = ?").get(categoryId);
  if (!category) return false;
  db.prepare(`UPDATE case_studies SET category = COALESCE((
    SELECT c.name FROM case_study_categories sc JOIN categories c ON c.id = sc.category_id
    WHERE sc.case_study_id = case_studies.id AND sc.category_id <> ?
    ORDER BY sc.position, sc.category_id LIMIT 1
  ), '') WHERE EXISTS (
    SELECT 1 FROM category_legacy_names aliases WHERE aliases.category_id = ? AND aliases.name = TRIM(case_studies.category) COLLATE NOCASE
  )`).run(categoryId, categoryId);
  db.prepare(`UPDATE insights SET category = '' WHERE EXISTS (
    SELECT 1 FROM category_legacy_names aliases WHERE aliases.category_id = ? AND aliases.name = TRIM(insights.category) COLLATE NOCASE
  )`).run(categoryId);
  db.prepare("DELETE FROM case_study_categories WHERE category_id = ?").run(categoryId);
  db.prepare("DELETE FROM service_items WHERE category_id = ?").run(categoryId);
  db.prepare("DELETE FROM category_legacy_names WHERE category_id = ?").run(categoryId);
  db.prepare("DELETE FROM categories WHERE id = ?").run(categoryId);
  return true;
}

