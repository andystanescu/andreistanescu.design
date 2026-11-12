import type { DatabaseSync } from "node:sqlite";

/** Caller owns the transaction. Disabling retains the page and all content. */
export function setDedicatedService(db: DatabaseSync, categoryId: number, enabled: boolean) {
  const category = db.prepare("SELECT id, name, description, position FROM categories WHERE id = ?").get(categoryId) as { id: number; name: string; description: string; position: number } | undefined;
  if (!category) throw new Error("Category not found");
  const service = db.prepare("SELECT id FROM service_items WHERE category_id = ?").get(category.id) as { id: number } | undefined;
  if (service) {
    db.prepare("UPDATE service_items SET service_enabled = ?, published = CASE WHEN ? = 1 THEN 1 ELSE published END WHERE id = ?").run(Number(enabled), Number(enabled), service.id);
  } else if (enabled) {
    const base = category.name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `category-${category.id}`;
    const slugExists = db.prepare("SELECT 1 FROM service_items WHERE slug = ?");
    let slug = base;
    let suffix = 2;
    while (slugExists.get(slug)) slug = `${base}-${suffix++}`;
    db.prepare("INSERT INTO service_items (category_id, service_enabled, slug, title, description, position, published) VALUES (?, 1, ?, ?, ?, ?, 1)").run(category.id, slug, category.name, category.description, category.position);
  }
}
