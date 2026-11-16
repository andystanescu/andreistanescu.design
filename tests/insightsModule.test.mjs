import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { migrateCategoryFoundation } from "../src/lib/categoryMigration.ts";
import { migrateInsightsSchema, migrateInsightsCategories, setInsightCategory, unlinkInsightsCategory } from "../src/modules/insights/migration.ts";

function core() {
  const db = new DatabaseSync(":memory:");
  db.exec("CREATE TABLE settings(key TEXT PRIMARY KEY, value TEXT NOT NULL); CREATE TABLE case_studies(id INTEGER PRIMARY KEY, category TEXT NOT NULL); INSERT INTO case_studies VALUES (1, 'Research');");
  migrateCategoryFoundation(db);
  return db;
}

test("Insights installs onto Core without Services and preserves article metadata", () => {
  const db = core();
  const categoryId = db.prepare("SELECT id FROM categories WHERE name = 'Research'").get().id;
  migrateInsightsSchema(db);
  db.exec("INSERT INTO insights(slug,title,excerpt,published_at,scheduled_at,category,published,meta_title,cover_image) VALUES ('study','Title','Excerpt','2026-01-01','2026-12-01','Research',0,'Metadata','/uploads/cover.png')");
  migrateInsightsCategories(db);
  const relation = db.prepare("SELECT category_id FROM insight_categories").get();
  assert.equal(relation.category_id, categoryId);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM case_study_categories WHERE category_id = ?").get(categoryId).n, 1);
  migrateInsightsSchema(db); migrateInsightsCategories(db);
  assert.deepEqual({ ...db.prepare("SELECT slug,published,scheduled_at,meta_title,cover_image FROM insights").get() }, { slug: "study", published: 0, scheduled_at: "2026-12-01", meta_title: "Metadata", cover_image: "/uploads/cover.png" });
  assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='service_items'").get(), undefined);
  db.close();
});

test("renamed Core categories reconnect article names when Insights returns", () => {
  const db = core(); migrateInsightsSchema(db);
  db.exec("INSERT INTO insights(slug,title,excerpt,published_at,category) VALUES ('article','Title','Excerpt','2026-01-01','Research')");
  migrateInsightsCategories(db);
  db.exec("UPDATE categories SET name = 'User research' WHERE name = 'Research'");
  migrateInsightsCategories(db);
  assert.equal(db.prepare("SELECT category FROM insights").get().category, "User research");
  db.close();
});

test("article assignments reject missing categories and can be detached without deleting articles", () => {
  const db = core(); migrateInsightsSchema(db); migrateInsightsCategories(db);
  db.exec("INSERT INTO insights(slug,title,excerpt,published_at) VALUES ('article','Title','Excerpt','2026-01-01')");
  assert.throws(() => setInsightCategory(db, 1, "Missing"), /missing/);
  setInsightCategory(db, 1, "Research");
  const id = db.prepare("SELECT id FROM categories WHERE name = 'Research'").get().id;
  unlinkInsightsCategory(db, id);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM insights").get().n, 1);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM insight_categories").get().n, 0);
  db.close();
});
