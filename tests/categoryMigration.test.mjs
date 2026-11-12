import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { migrateCategoryFoundation } from "../src/lib/categoryMigration.ts";

function fixture() {
  const db = new DatabaseSync(":memory:");
  db.exec(`CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE service_items (id INTEGER PRIMARY KEY, title TEXT NOT NULL);
    CREATE TABLE case_studies (id INTEGER PRIMARY KEY, category TEXT NOT NULL);
    CREATE TABLE insights (id INTEGER PRIMARY KEY, category TEXT NOT NULL);
    INSERT INTO service_items VALUES (1, 'Design Systems'), (2, 'Governance');
    INSERT INTO case_studies VALUES (1, 'Design Systems'), (2, ''), (3, 'Unlisted capability');
    INSERT INTO insights VALUES (1, 'Governance'), (2, 'Article-only capability');`);
  return db;
}

test("migration preserves assignments and categories independent of services", () => {
  const db = fixture();
  migrateCategoryFoundation(db);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM categories").get().n, 4);
  assert.deepEqual({ ...db.prepare("SELECT s.id, c.name FROM case_studies s JOIN case_study_categories sc ON sc.case_study_id=s.id JOIN categories c ON c.id=sc.category_id WHERE s.id=1").get() }, { id: 1, name: "Design Systems" });
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM case_study_categories WHERE case_study_id=2").get().n, 0);
  db.exec("DELETE FROM service_items");
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM categories").get().n, 4);
  db.close();
});

test("migration does not restore a deliberately removed assignment on reinitialization", () => {
  const db = fixture();
  migrateCategoryFoundation(db);
  db.exec("DELETE FROM case_study_categories WHERE case_study_id=1");
  migrateCategoryFoundation(db);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM case_study_categories WHERE case_study_id=1").get().n, 0);
  db.close();
});
