import type { DatabaseSync } from "node:sqlite";

/** Protect legacy Services records even when the Services extension is absent.
 * Caller must run this inside the same transaction as category deletion.
 */
export function protectUnmanagedServiceCategory(
  db: DatabaseSync,
  categoryId: number,
  servicesManagesDeletion: boolean,
): string | undefined {
  const tableExists = Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='service_items'").get());
  if (!tableExists) return;
  const hasCategoryLink = (db.prepare("PRAGMA table_info(service_items)").all() as Array<{ name: string }>).some(({ name }) => name === "category_id");
  if (!hasCategoryLink || (!servicesManagesDeletion && db.prepare("SELECT 1 FROM service_items WHERE category_id = ?").get(categoryId))) {
    return "This category has stored service content. Enable Services to review and delete it.";
  }
}

/** Caller owns the transaction. Case studies and articles themselves are retained. */
export function deleteCategory(db: DatabaseSync, categoryId: number) {
  const category = db.prepare("SELECT id FROM categories WHERE id = ?").get(categoryId);
  if (!category) return false;
  const protection = protectUnmanagedServiceCategory(db, categoryId, false);
  if (protection) throw new Error(protection);
  db.prepare(`UPDATE case_studies SET category = COALESCE((
    SELECT c.name FROM case_study_categories sc JOIN categories c ON c.id = sc.category_id
    WHERE sc.case_study_id = case_studies.id AND sc.category_id <> ?
    ORDER BY sc.position, sc.category_id LIMIT 1
  ), '') WHERE EXISTS (
    SELECT 1 FROM category_legacy_names aliases WHERE aliases.category_id = ? AND aliases.name = TRIM(case_studies.category) COLLATE NOCASE
  )`).run(categoryId, categoryId);
  db.prepare("DELETE FROM case_study_categories WHERE category_id = ?").run(categoryId);
  db.prepare("DELETE FROM pending_case_study_categories WHERE category_id = ?").run(categoryId);
  db.prepare("DELETE FROM category_legacy_names WHERE category_id = ?").run(categoryId);
  db.prepare("DELETE FROM categories WHERE id = ?").run(categoryId);
  return true;
}

