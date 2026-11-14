import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readEngagementOverview, overviewShare } from "../src/lib/engagementOverview.ts";

function fixture() {
  const db = new DatabaseSync(":memory:");
  db.exec(`CREATE TABLE engagement_sessions(session_id TEXT, actor_class TEXT, engagement_level TEXT, started_at TEXT);
  CREATE TABLE engagement_events(session_id TEXT, event_type TEXT);
  CREATE TABLE submissions(blocked INTEGER, created_at TEXT);`);
  return db;
}

test("overview separates likely-human sessions, events and accepted enquiries", () => {
  const db = fixture();
  const session = db.prepare("INSERT INTO engagement_sessions VALUES (?, ?, ?, ?)");
  session.run("human", "likely_human", "engaged", "2026-11-12 12:00:00");
  session.run("deep", "likely_human", "deep", "2026-11-11 12:00:00");
  session.run("uncertain", "uncertain", "deep", "2026-11-11 12:00:00");
  session.run("bot", "verified_bot", "engaged", "2026-11-11 12:00:00");
  session.run("old", "likely_human", "engaged", "2026-10-01 00:00:00");
  db.exec("INSERT INTO engagement_events VALUES ('human', 'page_view'), ('human', 'page_view'), ('uncertain', 'page_view'), ('bot', 'page_view'); INSERT INTO submissions VALUES (0, '2026-11-12 12:00:00'), (1, '2026-11-12 12:00:00'), (0, '2026-10-01 00:00:00')");
  const report = readEngagementOverview(db, "7d", new Date("2026-11-14T12:00:00Z"));
  assert.deepEqual(report.current, { sessions: 2, engaged: 2, deep: 1, pageViews: 2, enquiries: 1 });
  assert.equal(report.comparisonAvailable, false);
  assert.equal(overviewShare(1, 2), null);
  assert.equal(overviewShare(5, 20), 25);
  db.close();
});

test("comparison requires a sufficiently large sample in both windows and earlier tracking", () => {
  const db = fixture();
  const session = db.prepare("INSERT INTO engagement_sessions VALUES (?, ?, ?, ?)");
  session.run("earliest", "uncertain", "visited", "2026-10-01 00:00:00");
  for (let i = 0; i < 20; i++) {
    session.run(`current${i}`, "likely_human", "engaged", "2026-11-12 12:00:00");
    session.run(`previous${i}`, "likely_human", "engaged", "2026-11-03 12:00:00");
  }
  const report = readEngagementOverview(db, "7d", new Date("2026-11-14T12:00:00Z"));
  assert.equal(report.comparisonAvailable, true);
  assert.equal(report.previous.sessions, 20);
  assert.equal(readEngagementOverview(db, "all", new Date("2026-11-14T12:00:00Z")).comparisonAvailable, false);
  db.close();
});

test("missing engagement tracking does not invent a session history", () => {
  const db = fixture();
  db.exec("INSERT INTO submissions VALUES (0, '2026-11-12 12:00:00')");
  const report = readEngagementOverview(db, "30d", new Date("2026-11-14T12:00:00Z"));
  assert.equal(report.trackingStart, null);
  assert.equal(report.current.sessions, 0);
  assert.equal(report.current.enquiries, 1);
  assert.equal(report.comparisonAvailable, false);
  db.close();
});
