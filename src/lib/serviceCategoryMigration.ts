import type { DatabaseSync } from "node:sqlite";

/** Link existing service pages to Core categories without changing their URLs. */
export function migrateServiceCategories(db: DatabaseSync) {
  const categoryColumns = db.prepare("PRAGMA table_info(categories)").all() as Array<{ name: string }>;
  const addPosition = !categoryColumns.some((column) => column.name === "position");
  const addDescription = !categoryColumns.some((column) => column.name === "description");
  if (addPosition) db.exec("ALTER TABLE categories ADD COLUMN position INTEGER NOT NULL DEFAULT 0");
  if (addDescription) db.exec("ALTER TABLE categories ADD COLUMN description TEXT NOT NULL DEFAULT ''");
  const columns = db.prepare("PRAGMA table_info(service_items)").all() as Array<{ name: string }>;
  if (!columns.some((column) => column.name === "category_id")) db.exec("ALTER TABLE service_items ADD COLUMN category_id INTEGER REFERENCES categories(id)");
  if (!columns.some((column) => column.name === "service_enabled")) {
    db.exec("ALTER TABLE service_items ADD COLUMN service_enabled INTEGER NOT NULL DEFAULT 1");
    db.exec("UPDATE service_items SET service_enabled = published");
  }
  db.exec(`
    INSERT OR IGNORE INTO categories(name)
      SELECT TRIM(s.title) FROM service_items s
      WHERE s.category_id IS NULL AND TRIM(s.title) <> ''
        AND NOT EXISTS (SELECT 1 FROM category_legacy_names a WHERE a.name = TRIM(s.title) COLLATE NOCASE);
    INSERT OR IGNORE INTO category_legacy_names(name, category_id) SELECT name, id FROM categories;
    UPDATE service_items SET category_id = (
      SELECT category_id FROM category_legacy_names WHERE name = TRIM(service_items.title) COLLATE NOCASE
    ) WHERE category_id IS NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS service_items_category_id ON service_items(category_id) WHERE category_id IS NOT NULL;
  `);
  if (addPosition) db.exec(`UPDATE categories SET position = COALESCE(
    (SELECT position FROM service_items WHERE category_id = categories.id),
    (SELECT COALESCE(MAX(position), -1) + categories.id FROM service_items)
  )`);
  if (addDescription) db.exec("UPDATE categories SET description = COALESCE((SELECT description FROM service_items WHERE category_id = categories.id), '')");
}
