import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { migrateCategoryFoundation } from "../src/lib/categoryMigration.ts";
import { migrateServiceCategories } from "../src/lib/serviceCategoryMigration.ts";
import { setDedicatedService } from "../src/lib/serviceCategoryOperations.ts";
import { deleteCategory } from "../src/lib/categoryDeletion.ts";
import { applyPendingCategoryAssignments } from "../src/lib/pendingCategoryAssignments.ts";
import { exportCategoryAssignments, importCategoryAssignments, importCoreCategories } from "../src/lib/coreCategoryTransfer.ts";

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
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM categories").get().n, 2);
  assert.deepEqual({ ...db.prepare("SELECT s.id, c.name FROM case_studies s JOIN case_study_categories sc ON sc.case_study_id=s.id JOIN categories c ON c.id=sc.category_id WHERE s.id=1").get() }, { id: 1, name: "Design Systems" });
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM case_study_categories WHERE case_study_id=2").get().n, 0);
  db.exec("DELETE FROM service_items");
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM categories").get().n, 2);
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

test("Core categories and assignments work without Services or Insights tables", () => {
  const db = new DatabaseSync(":memory:");
  db.exec("CREATE TABLE settings(key TEXT PRIMARY KEY, value TEXT NOT NULL); CREATE TABLE case_studies(id INTEGER PRIMARY KEY, slug TEXT, category TEXT NOT NULL); INSERT INTO case_studies VALUES (1, 'project', 'Research');");
  migrateCategoryFoundation(db);
  const category = db.prepare("SELECT id, name FROM categories WHERE name = 'Research'").get();
  assert.ok(category);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM case_study_categories WHERE category_id = ?").get(category.id).n, 1);
  db.prepare("INSERT INTO categories(name, description, position) VALUES ('Accessibility', 'Capability', 2)").run();
  db.prepare("UPDATE categories SET name = 'Inclusive design' WHERE name = 'Accessibility'").run();
  assert.equal(deleteCategory(db, category.id), true);
  assert.equal(db.prepare("SELECT category FROM case_studies WHERE id = 1").get().category, "");
  db.close();
});

test("installing Services later preserves category identity and study assignments", () => {
  const db = new DatabaseSync(":memory:");
  db.exec("CREATE TABLE settings(key TEXT PRIMARY KEY, value TEXT NOT NULL); CREATE TABLE case_studies(id INTEGER PRIMARY KEY, slug TEXT, category TEXT NOT NULL); INSERT INTO case_studies VALUES (1, 'project', 'Research');");
  migrateCategoryFoundation(db);
  const id = db.prepare("SELECT id FROM categories WHERE name = 'Research'").get().id;
  db.exec("CREATE TABLE service_items(id INTEGER PRIMARY KEY, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, description TEXT NOT NULL, body TEXT DEFAULT '', position INTEGER DEFAULT 0, published INTEGER DEFAULT 1)");
  migrateServiceCategories(db);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM service_items").get().n, 0);
  setDedicatedService(db, id, true);
  assert.equal(db.prepare("SELECT category_id FROM service_items").get().category_id, id);
  assert.equal(db.prepare("SELECT category_id FROM case_study_categories WHERE case_study_id = 1").get().category_id, id);
  setDedicatedService(db, id, false);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM case_study_categories").get().n, 1);
  db.close();
});

test("category assignments imported before a case study are restored later", () => {
  const db = new DatabaseSync(":memory:");
  db.exec("CREATE TABLE settings(key TEXT PRIMARY KEY, value TEXT NOT NULL); CREATE TABLE case_studies(id INTEGER PRIMARY KEY, slug TEXT, category TEXT NOT NULL);");
  migrateCategoryFoundation(db);
  db.exec("INSERT INTO categories(name) VALUES ('Research'); INSERT INTO pending_case_study_categories(study_slug, category_id, position) SELECT 'project', id, 0 FROM categories; INSERT INTO case_studies VALUES (1, 'project', '');");
  assert.equal(applyPendingCategoryAssignments(db, 1, "project"), 1);
  assert.equal(db.prepare("SELECT category FROM case_studies WHERE id = 1").get().category, "Research");
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM pending_case_study_categories").get().n, 0);
  db.close();
});

test("Core category-only transfer preserves multiple assignments across installations and deferred imports", () => {
  const create = () => { const db = new DatabaseSync(":memory:"); db.exec("CREATE TABLE settings(key TEXT PRIMARY KEY, value TEXT NOT NULL); CREATE TABLE case_studies(id INTEGER PRIMARY KEY, slug TEXT, category TEXT NOT NULL);"); migrateCategoryFoundation(db); return db; };
  const source = create();
  source.exec("INSERT INTO categories(name) VALUES ('Research'), ('Accessibility'); INSERT INTO category_legacy_names SELECT name, id FROM categories; INSERT INTO case_studies VALUES (1, 'project', 'Research'); INSERT INTO case_study_categories SELECT 1, id, id-1 FROM categories;");
  const assignments = exportCategoryAssignments(source);
  assert.deepEqual(assignments, [{ slug: "project", category_names: ["Research", "Accessibility"] }]);
  const destination = create();
  destination.exec("INSERT INTO categories(name) VALUES ('Accessibility'), ('Research'); INSERT INTO category_legacy_names SELECT name, id FROM categories;");
  importCategoryAssignments(destination, assignments);
  assert.deepEqual(exportCategoryAssignments(destination), assignments);
  destination.exec("INSERT INTO case_studies VALUES (42, 'project', '');");
  assert.equal(applyPendingCategoryAssignments(destination, 42, "project"), 2);
  assert.deepEqual(exportCategoryAssignments(destination), assignments);
  assert.equal(destination.prepare("SELECT category FROM case_studies WHERE id = 42").get().category, "Research");
  source.close(); destination.close();
});

test("category import uses a historical alias to preserve identity after a rename", () => {
  const db = new DatabaseSync(":memory:");
  db.exec("CREATE TABLE settings(key TEXT PRIMARY KEY, value TEXT NOT NULL); CREATE TABLE case_studies(id INTEGER PRIMARY KEY, slug TEXT, category TEXT NOT NULL); INSERT INTO case_studies VALUES (1, 'project', 'Research');");
  migrateCategoryFoundation(db);
  const id = db.prepare("SELECT id FROM categories WHERE name = 'Research'").get().id;
  importCoreCategories(db, [{ name: "User research", description: "", position: 0, aliases: ["Research"] }]);
  assert.equal(db.prepare("SELECT id FROM categories WHERE name = 'User research'").get().id, id);
  assert.equal(db.prepare("SELECT category FROM case_studies WHERE id = 1").get().category, "User research");
  assert.equal(db.prepare("SELECT category_id FROM case_study_categories WHERE case_study_id = 1").get().category_id, id);
  db.close();
});
