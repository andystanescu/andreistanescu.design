import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readContentPerformance } from "../src/lib/contentPerformance.ts";

function fixture() {
  const db = new DatabaseSync(":memory:");
  db.exec(`CREATE TABLE engagement_sessions (session_id TEXT, actor_class TEXT, started_at TEXT, measurement_version INTEGER DEFAULT 1);
    CREATE TABLE engagement_pages (id INTEGER PRIMARY KEY, session_id TEXT, page_key TEXT, title TEXT, content_type TEXT, content_id TEXT, active_seconds INTEGER, max_depth INTEGER, engagement_level TEXT, last_seen_at TEXT);
    CREATE TABLE engagement_events (id INTEGER PRIMARY KEY, session_id TEXT, page_key TEXT, event_type TEXT, detail TEXT, value INTEGER DEFAULT 0);
    INSERT INTO engagement_sessions (session_id,actor_class,started_at,measurement_version) VALUES ('a','likely_human',datetime('now'),2),('b','likely_human',datetime('now'),1),('uncertain','uncertain',datetime('now'),2),('bot','verified_bot',datetime('now'),2);
    INSERT INTO engagement_pages VALUES (1,'a','/work/one','One','case_study','one',30,100,'engaged',datetime('now')),
      (2,'a','/work/two','Two','case_study','two',10,25,'deep',datetime('now')),
      (3,'b','/work/one','One','case_study','one',40,50,'visited',datetime('now')),
      (4,'uncertain','/work/one','One','case_study','one',999,100,'deep',datetime('now')),
      (5,'bot','/work/one','One','case_study','one',999,100,'deep',datetime('now')),
      (6,'a','/services/design-systems','Design systems','service','design-systems',20,50,'engaged',datetime('now'));
    INSERT INTO engagement_events (id,session_id,page_key,event_type,detail) VALUES (1,'a','/work/one','page_view',''), (2,'a','/work/two','page_view',''), (3,'a','/services/design-systems','page_view',''), (4,'a','/services/design-systems','action','evidence_open'), (5,'a','/work/one','exposure_attended','section_1'), (6,'a','/contact','action','contact_submission');
    INSERT INTO engagement_events VALUES (7,'a','/work/one','exposure_ready','v2',2);`);
  return db;
}

test("content performance uses likely-human page sessions, ranks by engagement and deduplicates type totals", () => {
  const db=fixture();
  const report=readContentPerformance(db,"30d");
  const group=report.groups.find((item)=>item.group==="case_study");
  assert.equal(group.sessions,2);
  assert.equal(group.engaged,1);
  assert.equal(group.itemCount,2);
  assert.equal(group.medianAttention,30);
  assert.equal(group.items[0].pageKey,"/work/one");
  assert.equal(group.items[0].sessions,2);
  assert.equal(group.items[0].medianAttention,35);
  assert.equal(group.items[0].onward,1);
  assert.equal(group.items[0].reachedEnd,1);
  assert.equal(group.items[0].measuredSessions,1);
  assert.equal(group.items[0].exposurePercent,50);
  assert.equal(group.items[0].trackedSessions,1);
  assert.equal(group.items[0].submissionSessions,1);
  assert.equal(report.groups.find((item)=>item.group==="service").items[0].evidenceOpened,1);
  db.close();
});

test("filtered groups paginate safely and unknown groups do not alter the default", () => {
  const db=fixture();
  const selected=readContentPerformance(db,"all",{group:"case_study",page:999});
  assert.equal(selected.page,1);
  assert.equal(selected.total,2);
  assert.deepEqual(selected.groups.map((item)=>item.group),["case_study"]);
  assert.equal(readContentPerformance(db,"all",{group:"invalid"}).selectedGroup,null);
  db.close();
});
