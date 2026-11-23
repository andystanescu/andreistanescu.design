import type { DatabaseSync } from "node:sqlite";

/** Create the Services-owned table without changing existing records. */
export function migrateServicesSchema(db: DatabaseSync) {
  db.exec(`CREATE TABLE IF NOT EXISTS service_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    show_on_homepage INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL DEFAULT 0,
    published INTEGER NOT NULL DEFAULT 1,
    card_size TEXT NOT NULL DEFAULT 'standard',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );`);
}

/** Upgrade older installations before category links are migrated. */
export function migrateServicesColumns(db: DatabaseSync) {
  const columns = new Set((db.prepare("PRAGMA table_info(service_items)").all() as Array<{ name: string }>).map(({ name }) => name));
  const additions: Array<[string, string]> = [
    ["card_size", "card_size TEXT NOT NULL DEFAULT 'standard'"],
    ["template_key", "template_key TEXT NOT NULL DEFAULT ''"],
    ["hero_lead", "hero_lead TEXT NOT NULL DEFAULT ''"],
    ["hero_description", "hero_description TEXT NOT NULL DEFAULT ''"],
    ["section_content", "section_content TEXT NOT NULL DEFAULT '{}'"] ,
    ["section_settings", "section_settings TEXT NOT NULL DEFAULT '{}'"] ,
  ];
  for (const [name, definition] of additions) {
    if (!columns.has(name)) db.exec(`ALTER TABLE service_items ADD COLUMN ${definition}`);
  }
}


/** Link existing service pages to Core categories without changing their URLs. */
export function migrateServiceCategories(db: DatabaseSync) {
  const categoryColumns = db.prepare("PRAGMA table_info(categories)").all() as Array<{ name: string }>;
  const addPosition = !categoryColumns.some((column) => column.name === "position");
  const addDescription = !categoryColumns.some((column) => column.name === "description");
  if (addPosition) db.exec("ALTER TABLE categories ADD COLUMN position INTEGER NOT NULL DEFAULT 0");
  if (addDescription) db.exec("ALTER TABLE categories ADD COLUMN description TEXT NOT NULL DEFAULT ''");
  const columns = db.prepare("PRAGMA table_info(service_items)").all() as Array<{ name: string }>;
  const addedLink = !columns.some((column) => column.name === "category_id");
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
    UPDATE service_items SET title = (SELECT name FROM categories WHERE id = service_items.category_id)
      WHERE category_id IS NOT NULL AND EXISTS (SELECT 1 FROM categories WHERE id = service_items.category_id);
    CREATE UNIQUE INDEX IF NOT EXISTS service_items_category_id ON service_items(category_id) WHERE category_id IS NOT NULL;
  `);
  if (addPosition || addedLink) db.exec(`UPDATE categories SET position = COALESCE(
    (SELECT position FROM service_items WHERE category_id = categories.id),
    (SELECT COALESCE(MAX(position), -1) + categories.id FROM service_items)
  )`);
  if (addDescription || addedLink) db.exec("UPDATE categories SET description = COALESCE((SELECT description FROM service_items WHERE category_id = categories.id), description) WHERE description = ''");
}
