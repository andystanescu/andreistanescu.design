import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { parseValueContent, readValueEvidenceOptions } from "../src/lib/homepageValueContent.ts";

test("three propositions can independently share an evidence reference", () => {
  const items = parseValueContent(JSON.stringify({ propositions: [{ title: "First", description: "A", evidence: { type: "case_study", id: 7 } }, { title: "Second", description: "B", evidence: { type: "case_study", id: 7 } }] }));
  assert.equal(items.length, 3);
  assert.deepEqual(items[0].evidence, items[1].evidence);
  assert.equal(items[2].title, "");
  assert.equal(parseValueContent("bad").length, 3);
});

test("evidence follows source edits and excludes drafts, private studies and scheduled articles", () => {
  const db = new DatabaseSync(":memory:");
  db.exec(`CREATE TABLE case_studies(id INTEGER, slug TEXT, title TEXT, published INTEGER, password_required INTEGER, position INTEGER);
    CREATE TABLE insights(id INTEGER, slug TEXT, title TEXT, published INTEGER, scheduled_at TEXT, position INTEGER);
    INSERT INTO case_studies VALUES(1,'original','Original',1,0,0),(2,'private','Private',1,1,1),(3,'draft','Draft',0,0,2);
    INSERT INTO insights VALUES(1,'article','Article',1,'',0),(2,'future','Future',1,'2099-01-01',1);`);
  const now = "2026-11-14";
  assert.deepEqual(readValueEvidenceOptions(db, now).map((item) => item.title), ["Original", "Article"]);
  db.exec("UPDATE case_studies SET slug='updated', title='Updated' WHERE id=1");
  const updated = readValueEvidenceOptions(db, now).find((item) => item.type === "case_study" && item.id === 1);
  assert.equal(updated.title, "Updated");
  assert.equal(updated.href, "/work/updated");
  db.exec("UPDATE case_studies SET published=0 WHERE id=1");
  assert.equal(readValueEvidenceOptions(db, now).some((item) => item.type === "case_study" && item.id === 1), false);
  db.exec("DROP TABLE insights");
  assert.deepEqual(readValueEvidenceOptions(db, now), []);
  db.close();
});
