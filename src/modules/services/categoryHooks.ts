import type { DatabaseSync } from "node:sqlite";

/** Keep the service's legacy display fields in sync with its category. */
export function updateServiceCategory(db: DatabaseSync, category: { id: number; name: string; description: string }): void {
  db.prepare("UPDATE service_items SET title = ?, description = ? WHERE category_id = ?").run(category.name, category.description, category.id);
}

export function reorderServiceCategories(db: DatabaseSync, categoryIds: readonly number[]): void {
  const update = db.prepare("UPDATE service_items SET position = ? WHERE category_id = ?");
  categoryIds.forEach((id, position) => update.run(position, id));
}

/** Keep disabled, possibly unconverted Services data safe. */
export function prepareServiceCategoryDeletion(db: DatabaseSync, categoryId: number, enabled: boolean): string | undefined {
  const hasTable = Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='service_items'").get());
  const hasLink = hasTable && (db.prepare("PRAGMA table_info(service_items)").all() as Array<{ name: string }>).some(({ name }) => name === "category_id");
  if (hasTable && !enabled && (!hasLink || db.prepare("SELECT 1 FROM service_items WHERE category_id = ?").get(categoryId))) {
    return "This category has stored service content. Enable Services to review and delete it.";
  }
  if (hasLink && enabled) db.prepare("DELETE FROM service_items WHERE category_id = ?").run(categoryId);
}
