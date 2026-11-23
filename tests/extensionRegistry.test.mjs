import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { createExtensionRegistry, enabledExtensions, runExtensionMigrations } from "../src/platform/extensions/contract.ts";
import { migrateCategoryFoundation } from "../src/lib/categoryMigration.ts";
import { migrateServiceCategories, migrateServicesSchema, migrateServicesColumns } from "../src/modules/services/migration.ts";
import { seedServices } from "../src/modules/services/seed.ts";
import { migrateInsightsSchema, migrateInsightsCategories } from "../src/modules/insights/migration.ts";

test("registration is distinct from enablement and preserves stage order", () => {
  const db = new DatabaseSync(":memory:");
  const calls = [];
  const extension = (id, enabled) => ({ id, contractVersion: 1, isEnabled: () => enabled, migrations: {
    schema: () => calls.push(`${id}:schema`), afterCategories: () => calls.push(`${id}:categories`),
  } });
  const registry = createExtensionRegistry([extension("insights", true), extension("services", false), extension("other", true)]);
  assert.equal(registry.length, 3);
  const enabled = enabledExtensions(registry);
  assert.deepEqual(enabled.map(({ id }) => id), ["insights", "other"]);
  runExtensionMigrations(enabled, "schema", db);
  runExtensionMigrations(enabled, "afterCategories", db);
  assert.deepEqual(calls, ["insights:schema", "other:schema", "insights:categories", "other:categories"]);
  db.close();
});

test("a failing extension migration rolls back with the caller's transaction", () => {
  const db = new DatabaseSync(":memory:");
  db.exec("CREATE TABLE records(value TEXT); INSERT INTO records VALUES ('existing');");
  const registry = createExtensionRegistry([
    { id: "first", contractVersion: 1, isEnabled: () => true, migrations: { schema: (connection) => connection.exec("INSERT INTO records VALUES ('new')") } },
    { id: "second", contractVersion: 1, isEnabled: () => true, migrations: { schema: () => { throw new Error("migration failed"); } } },
  ]);
  db.exec("BEGIN IMMEDIATE");
  assert.throws(() => runExtensionMigrations(enabledExtensions(registry), "schema", db), /migration failed/);
  db.exec("ROLLBACK");
  assert.deepEqual(db.prepare("SELECT value FROM records").all().map(({ value }) => value), ["existing"]);
  db.close();
});

test("duplicate IDs and unsupported contracts are rejected", () => {
  const valid = { id: "services", contractVersion: 1, isEnabled: () => true };
  assert.throws(() => createExtensionRegistry([valid, valid]), /Duplicate/);
  assert.throws(() => createExtensionRegistry([{ ...valid, contractVersion: 2 }]), /Unsupported/);
  assert.throws(() => createExtensionRegistry([{ ...valid, id: "invalid id" }]), /Invalid/);
  assert.throws(() => createExtensionRegistry([{ ...valid, isEnabled: null }]), /enablement/);
  assert.throws(() => createExtensionRegistry([{ ...valid, migrations: { schema: "invalid" } }]), /migration/);
});

test("real migration hooks support each add-on combination and retain disabled data", () => {
  for (const insights of [false, true]) for (const services of [false, true]) {
    const db = new DatabaseSync(":memory:");
    db.exec("CREATE TABLE settings(key TEXT PRIMARY KEY, value TEXT NOT NULL); CREATE TABLE case_studies(id INTEGER PRIMARY KEY, category TEXT NOT NULL); INSERT INTO case_studies VALUES (1, 'Research');");
    if (services) { migrateServicesSchema(db); db.exec("INSERT INTO service_items(slug,title,description) VALUES ('research','Research','Existing')"); }
    let insightsEnabled = insights;
    let servicesEnabled = services;
    const registry = createExtensionRegistry([
      { id: "insights", contractVersion: 1, isEnabled: () => insightsEnabled, migrations: { schema: migrateInsightsSchema, afterCategories: migrateInsightsCategories } },
      { id: "services", contractVersion: 1, isEnabled: () => servicesEnabled, migrations: { preSchema: migrateServicesSchema, afterCoreSchema: migrateServicesColumns, beforeCategories: seedServices, afterCategories: migrateServiceCategories } },
    ]);
    const initialize = () => {
      db.exec("BEGIN IMMEDIATE");
      try {
        const active = enabledExtensions(registry);
        runExtensionMigrations(active, "preSchema", db);
        runExtensionMigrations(active, "schema", db);
        runExtensionMigrations(active, "afterCoreSchema", db);
        runExtensionMigrations(active, "beforeCategories", db);
        migrateCategoryFoundation(db);
        runExtensionMigrations(active, "afterCategories", db);
        db.exec("COMMIT");
      } catch (error) { db.exec("ROLLBACK"); throw error; }
    };
    initialize();
    initialize();
    assert.equal(Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='insights'").get()), insights);
    if (insights) db.exec("INSERT INTO insights(slug,title,excerpt,published_at) VALUES ('article','Title','Excerpt','2026-01-01')");
    assert.equal(Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='service_items'").get()), services);
    if (services) {
      assert.ok(db.prepare("SELECT category_id FROM service_items WHERE slug='research'").get().category_id);
      assert.equal(db.prepare("SELECT card_size FROM service_items WHERE slug='research'").get().card_size, "standard");
    }
    insightsEnabled = false;
    servicesEnabled = false;
    initialize();
    if (insights) assert.equal(db.prepare("SELECT COUNT(*) AS n FROM insights").get().n, 1);
    if (services) assert.equal(db.prepare("SELECT COUNT(*) AS n FROM service_items").get().n, 1);
    insightsEnabled = insights;
    servicesEnabled = services;
    initialize();
    if (insights) assert.equal(db.prepare("SELECT COUNT(*) AS n FROM insights").get().n, 1);
    if (services) assert.equal(db.prepare("SELECT COUNT(*) AS n FROM service_items").get().n, 1);
    db.close();
  }
});


test("Services creates its own schema and upgrades existing rows without overwriting them", () => {
  const db = new DatabaseSync(":memory:");
  migrateServicesSchema(db);
  migrateServicesColumns(db);
  db.exec("INSERT INTO service_items(slug,title,description,section_content) VALUES ('example','Example','Existing','custom')");
  migrateServicesSchema(db);
  migrateServicesColumns(db);
  assert.equal(db.prepare("SELECT section_content FROM service_items WHERE slug='example'").get().section_content, "custom");
  db.close();
});


test("Services initialization seeds only a new installation and respects deletions", () => {
  const db = new DatabaseSync(":memory:");
  db.exec("CREATE TABLE settings(key TEXT PRIMARY KEY, value TEXT NOT NULL); CREATE TABLE case_studies(id INTEGER PRIMARY KEY, category TEXT NOT NULL)");
  migrateServicesSchema(db);
  migrateServicesColumns(db);
  seedServices(db);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM service_items").get().n, 5);
  migrateCategoryFoundation(db);
  migrateServiceCategories(db);
  db.exec("DELETE FROM service_items");
  seedServices(db);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM service_items").get().n, 0);
  db.close();
});

test("enabling Services after Core setup does not inject default services", () => {
  const db = new DatabaseSync(":memory:");
  db.exec("CREATE TABLE settings(key TEXT PRIMARY KEY, value TEXT NOT NULL); CREATE TABLE case_studies(id INTEGER PRIMARY KEY, category TEXT NOT NULL)");
  migrateCategoryFoundation(db);
  migrateServicesSchema(db);
  migrateServicesColumns(db);
  seedServices(db);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM service_items").get().n, 0);
  db.close();
});
