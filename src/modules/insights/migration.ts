import type { DatabaseSync } from "node:sqlite";

/** Insights-owned, additive schema. Called inside the application's migration transaction. */
export function migrateInsightsSchema(db: DatabaseSync) {
  db.exec(`CREATE TABLE IF NOT EXISTS insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, excerpt TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '', cover_image TEXT NOT NULL DEFAULT '', thumbnail_image TEXT NOT NULL DEFAULT '',
    published_at TEXT NOT NULL, scheduled_at TEXT NOT NULL DEFAULT '', position INTEGER NOT NULL DEFAULT 0,
    published INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime('now')),
    category TEXT NOT NULL DEFAULT '', tags TEXT NOT NULL DEFAULT '', author TEXT NOT NULL DEFAULT 'Andrei Stanescu',
    meta_title TEXT NOT NULL DEFAULT '', meta_description TEXT NOT NULL DEFAULT '', meta_keywords TEXT NOT NULL DEFAULT '',
    canonical_url TEXT NOT NULL DEFAULT '', og_image TEXT NOT NULL DEFAULT '', no_index INTEGER NOT NULL DEFAULT 0
  )`);
  const columns = new Set((db.prepare("PRAGMA table_info(insights)").all() as Array<{ name: string }>).map(({ name }) => name));
  const additions: Record<string, string> = { cover_image: "TEXT NOT NULL DEFAULT ''", thumbnail_image: "TEXT NOT NULL DEFAULT ''", scheduled_at: "TEXT NOT NULL DEFAULT ''", category: "TEXT NOT NULL DEFAULT ''", tags: "TEXT NOT NULL DEFAULT ''", author: "TEXT NOT NULL DEFAULT 'Andrei Stanescu'", meta_title: "TEXT NOT NULL DEFAULT ''", meta_description: "TEXT NOT NULL DEFAULT ''", meta_keywords: "TEXT NOT NULL DEFAULT ''", canonical_url: "TEXT NOT NULL DEFAULT ''", og_image: "TEXT NOT NULL DEFAULT ''", no_index: "INTEGER NOT NULL DEFAULT 0" };
  for (const [name, definition] of Object.entries(additions)) if (!columns.has(name)) db.exec(`ALTER TABLE insights ADD COLUMN ${name} ${definition}`);
  db.prepare("INSERT OR IGNORE INTO settings(key, value) VALUES ('insights_schema_v1', '1')").run();
}

/** Link existing article categories once; retain the category identity across renames. */
export function migrateInsightsCategories(db: DatabaseSync) {
  db.exec(`CREATE TABLE IF NOT EXISTS insight_categories (
    insight_id INTEGER PRIMARY KEY REFERENCES insights(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT
  )`);
  if (db.prepare("SELECT 1 FROM settings WHERE key = 'insights_categories_v1'").get()) {
    db.exec("UPDATE insights SET category = (SELECT c.name FROM insight_categories ic JOIN categories c ON c.id = ic.category_id WHERE ic.insight_id = insights.id) WHERE EXISTS (SELECT 1 FROM insight_categories ic WHERE ic.insight_id = insights.id)");
    return;
  }
  db.exec(`INSERT OR IGNORE INTO categories(name) SELECT TRIM(category) FROM insights WHERE TRIM(category) <> '' AND NOT EXISTS (SELECT 1 FROM category_legacy_names a WHERE a.name = TRIM(insights.category) COLLATE NOCASE);
    INSERT OR IGNORE INTO category_legacy_names(name, category_id) SELECT name, id FROM categories;
    INSERT OR IGNORE INTO insight_categories(insight_id, category_id) SELECT i.id, a.category_id FROM insights i JOIN category_legacy_names a ON a.name = TRIM(i.category) COLLATE NOCASE WHERE TRIM(i.category) <> '';
    INSERT INTO settings(key, value) VALUES ('insights_categories_v1', '1');`);
}

export function renameInsightCategory(db: DatabaseSync, oldName: string, name: string) {
  db.prepare("UPDATE insights SET category = ? WHERE category = ? COLLATE NOCASE").run(name, oldName);
}

export function unlinkInsightsCategory(db: DatabaseSync, categoryId: number) {
  db.prepare("UPDATE insights SET category = '' WHERE id IN (SELECT insight_id FROM insight_categories WHERE category_id = ?) OR EXISTS (SELECT 1 FROM category_legacy_names a WHERE a.category_id = ? AND a.name = TRIM(insights.category) COLLATE NOCASE)").run(categoryId, categoryId);
  db.prepare("DELETE FROM insight_categories WHERE category_id = ?").run(categoryId);
}

export function setInsightCategory(db: DatabaseSync, insightId: number, name: string) {
  const category = name.trim() ? db.prepare("SELECT category_id FROM category_legacy_names WHERE name = ? COLLATE NOCASE").get(name.trim()) as { category_id: number } | undefined : undefined;
  if (name.trim() && !category) throw new Error(`Article category ${name} is missing.`);
  db.prepare("DELETE FROM insight_categories WHERE insight_id = ?").run(insightId);
  if (category) db.prepare("INSERT INTO insight_categories(insight_id, category_id) VALUES (?, ?)").run(insightId, category.category_id);
}
