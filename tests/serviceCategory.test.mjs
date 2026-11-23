import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { migrateCategoryFoundation } from "../src/lib/categoryMigration.ts";
import { migrateServiceCategories } from "../src/modules/services/migration.ts";
import { setDedicatedService } from "../src/lib/serviceCategoryOperations.ts";
import { deleteCategory, protectUnmanagedServiceCategory } from "../src/lib/categoryDeletion.ts";
import { createExtensionRegistry, notifyCategoryUpdated, notifyCategoriesReordered, prepareCategoryDeletion } from "../src/platform/extensions/contract.ts";
import { updateServiceCategory, reorderServiceCategories, prepareServiceCategoryDeletion } from "../src/modules/services/categoryHooks.ts";
import { migrateInsightsCategories, unlinkInsightsCategory } from "../src/modules/insights/migration.ts";

function fixture() {
  const db = new DatabaseSync(":memory:");
  db.exec(`CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE service_items (id INTEGER PRIMARY KEY, slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, body TEXT DEFAULT '', position INTEGER DEFAULT 0, published INTEGER DEFAULT 1);
    CREATE TABLE case_studies (id INTEGER PRIMARY KEY, category TEXT NOT NULL);
    CREATE TABLE insights (id INTEGER PRIMARY KEY, category TEXT NOT NULL);
    INSERT INTO service_items(id,slug,title,description,body,position,published) VALUES (1,'original-url','Design Systems','Original description','Original content',0,1);
    INSERT INTO case_studies VALUES (1,'Design Systems');`);
  migrateCategoryFoundation(db);
  migrateServiceCategories(db);
  migrateInsightsCategories(db);
  return db;
}

test("existing service links to its category and keeps its URL and content through toggles", () => {
  const db = fixture();
  const category = db.prepare("SELECT id FROM categories WHERE name = ?").get("Design Systems");
  assert.equal(db.prepare("SELECT description FROM categories WHERE id = ?").get(category.id).description, "Original description");
  setDedicatedService(db, category.id, false);
  const disabled = db.prepare("SELECT * FROM service_items WHERE category_id = ?").get(category.id);
  assert.equal(disabled.service_enabled, 0);
  assert.equal(disabled.slug, "original-url");
  assert.equal(disabled.body, "Original content");
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM case_study_categories WHERE category_id = ?").get(category.id).n, 1);
  setDedicatedService(db, category.id, true);
  const restored = db.prepare("SELECT * FROM service_items WHERE category_id = ?").get(category.id);
  assert.equal(restored.id, disabled.id);
  assert.equal(restored.slug, "original-url");
  assert.equal(restored.body, "Original content");
  assert.equal(restored.description, "Original description");
  assert.equal(restored.service_enabled, 1);
  db.close();
});

test("a category becomes a service only when enabled, with a unique URL", () => {
  const db = fixture();
  db.prepare("INSERT INTO categories(name, description, position) VALUES (?, ?, ?)").run("Original URL", "A useful description", 2);
  const category = db.prepare("SELECT id FROM categories WHERE name = ?").get("Original URL");
  setDedicatedService(db, category.id, false);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM service_items WHERE category_id = ?").get(category.id).n, 0);
  setDedicatedService(db, category.id, true);
  assert.equal(db.prepare("SELECT slug FROM service_items WHERE category_id = ?").get(category.id).slug, "original-url-2");
  assert.equal(db.prepare("SELECT description FROM service_items WHERE category_id = ?").get(category.id).description, "A useful description");
  migrateServiceCategories(db);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM service_items WHERE category_id = ?").get(category.id).n, 1);
  db.close();
});

test("re-enabling the add-on syncs its legacy title after a Core category rename", () => {
  const db = fixture();
  const category = db.prepare("SELECT id FROM categories WHERE name = 'Design Systems'").get();
  db.prepare("UPDATE categories SET name = ? WHERE id = ?").run("Design practice", category.id);
  migrateServiceCategories(db);
  const service = db.prepare("SELECT category_id, title, slug, body FROM service_items WHERE category_id = ?").get(category.id);
  assert.equal(service.title, "Design practice");
  assert.equal(service.slug, "original-url");
  assert.equal(service.body, "Original content");
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM case_study_categories WHERE category_id = ?").get(category.id).n, 1);
  db.close();
});

test("deleting a category removes its service and assignments while retaining content", () => {
  const db = fixture();
  const category = db.prepare("SELECT id FROM categories WHERE name = ?").get("Design Systems");
  db.prepare("INSERT INTO categories(name, position) VALUES (?, ?)").run("Research", 2);
  const other = db.prepare("SELECT id FROM categories WHERE name = ?").get("Research");
  db.prepare("INSERT INTO case_study_categories(case_study_id, category_id, position) VALUES (1, ?, 1)").run(other.id);
  db.exec("INSERT INTO insights VALUES (1, 'Design Systems')");
  // The Services boundary removes its extension; Core removes the category.
  db.prepare("DELETE FROM service_items WHERE category_id = ?").run(category.id);
  unlinkInsightsCategory(db, category.id);
  assert.equal(deleteCategory(db, category.id), true);
  assert.equal(db.prepare("SELECT category FROM case_studies WHERE id = 1").get().category, "Research");
  assert.equal(db.prepare("SELECT category FROM insights WHERE id = 1").get().category, "");
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM case_study_categories WHERE category_id = ?").get(other.id).n, 1);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM service_items").get().n, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM categories WHERE id = ?").get(category.id).n, 0);
  db.close();
});


test("category callbacks update and reorder services in the same transaction", () => {
  const db = fixture();
  const category = db.prepare("SELECT id FROM categories WHERE name = 'Design Systems'").get();
  const registry = createExtensionRegistry([{ id: "services", contractVersion: 1, isEnabled: () => true, categories: { updated: updateServiceCategory, reordered: reorderServiceCategories, beforeDelete: prepareServiceCategoryDeletion } }]);
  db.exec("BEGIN IMMEDIATE");
  notifyCategoryUpdated(registry, db, { id: category.id, name: "Updated", description: "New description" });
  notifyCategoriesReordered(registry, db, [99, category.id]);
  assert.deepEqual({ ...db.prepare("SELECT title, description, position FROM service_items WHERE category_id = ?").get(category.id) }, { title: "Updated", description: "New description", position: 1 });
  db.exec("ROLLBACK");
  assert.equal(db.prepare("SELECT title FROM service_items WHERE category_id = ?").get(category.id).title, "Design Systems");
  db.close();
});

test("category deletion protects disabled Services data and deletes it when enabled", () => {
  const db = fixture();
  const category = db.prepare("SELECT id FROM categories WHERE name = 'Design Systems'").get();
  let enabled = false;
  const registry = createExtensionRegistry([{ id: "services", contractVersion: 1, isEnabled: () => enabled, categories: { beforeDelete: prepareServiceCategoryDeletion } }]);
  assert.match(prepareCategoryDeletion(registry, db, category.id), /Enable Services/);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM service_items").get().n, 1);
  enabled = true;
  db.exec("BEGIN IMMEDIATE");
  assert.equal(prepareCategoryDeletion(registry, db, category.id), undefined);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM service_items").get().n, 0);
  db.exec("ROLLBACK");
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM service_items").get().n, 1);
  db.close();
});

test("category callbacks work with no installed extensions", () => {
  const db = fixture();
  const category = db.prepare("SELECT id FROM categories WHERE name = 'Design Systems'").get();
  notifyCategoryUpdated([], db, { id: category.id, name: "Other", description: "" });
  notifyCategoriesReordered([], db, [category.id]);
  assert.equal(prepareCategoryDeletion([], db, category.id), undefined);
  assert.equal(db.prepare("SELECT title FROM service_items WHERE category_id = ?").get(category.id).title, "Design Systems");
  db.close();
});


test("Core protects retained Services data when the extension is absent", () => {
  const db = fixture();
  const linked = db.prepare("SELECT id FROM categories WHERE name = 'Design Systems'").get().id;
  db.prepare("INSERT INTO categories(name, position) VALUES ('Unrelated', 2)").run();
  const unrelated = db.prepare("SELECT id FROM categories WHERE name = 'Unrelated'").get().id;
  assert.match(protectUnmanagedServiceCategory(db, linked, false), /Enable Services/);
  assert.equal(protectUnmanagedServiceCategory(db, unrelated, false), undefined);
  assert.throws(() => deleteCategory(db, linked), /Enable Services/);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM service_items WHERE category_id = ?").get(linked).n, 1);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM categories WHERE id = ?").get(linked).n, 1);
  assert.equal(deleteCategory(db, unrelated), true);
  db.close();
});

test("Core conservatively protects legacy service tables with no category link", () => {
  const db = new DatabaseSync(":memory:");
  db.exec("CREATE TABLE service_items(id INTEGER PRIMARY KEY, title TEXT); INSERT INTO service_items VALUES (1, 'Legacy')");
  assert.match(protectUnmanagedServiceCategory(db, 1, false), /Enable Services/);
  db.close();
});

test("Core allows deletion when no Services table exists", () => {
  const db = new DatabaseSync(":memory:");
  assert.equal(protectUnmanagedServiceCategory(db, 1, false), undefined);
  db.close();
});
