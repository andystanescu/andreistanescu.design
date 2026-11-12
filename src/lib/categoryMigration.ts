import type { DatabaseSync } from "node:sqlite";

/** Called inside database initialization's transaction. Never remigrate edited assignments. */
export function migrateCategoryFoundation(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL COLLATE NOCASE UNIQUE
    );
    CREATE TABLE IF NOT EXISTS case_study_categories (
      case_study_id INTEGER NOT NULL REFERENCES case_studies(id) ON DELETE CASCADE,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      position INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (case_study_id, category_id)
    );
    CREATE TABLE IF NOT EXISTS category_legacy_names (
      name TEXT PRIMARY KEY COLLATE NOCASE,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE
    );
  `);
  const marker = db.prepare("SELECT value FROM settings WHERE key = ?").get("shared_categories_v1");
  if (marker) {
    db.exec("INSERT OR IGNORE INTO category_legacy_names(name, category_id) SELECT name, id FROM categories");
    return;
  }
  db.exec(`
    INSERT OR IGNORE INTO categories(name)
      SELECT TRIM(title) FROM service_items WHERE TRIM(title) <> '';
    INSERT OR IGNORE INTO categories(name)
      SELECT TRIM(category) FROM case_studies WHERE TRIM(category) <> '';
    INSERT OR IGNORE INTO categories(name)
      SELECT TRIM(category) FROM insights WHERE TRIM(category) <> '';
    INSERT OR IGNORE INTO category_legacy_names(name, category_id) SELECT name, id FROM categories;
    INSERT OR IGNORE INTO case_study_categories(case_study_id, category_id)
      SELECT s.id, c.id FROM case_studies s JOIN categories c ON c.name = TRIM(s.category) COLLATE NOCASE
      WHERE TRIM(s.category) <> '';
    INSERT INTO settings(key, value) VALUES ('shared_categories_v1', '1');
  `);
}
