import { db } from "@/lib/db";

export type Submission = {
  id: number;
  name: string;
  email: string;
  message: string;
  newsletter: number;
  emailed: number;
  blocked: number;
  email_error: string | null;
  created_at: string;
};

export function createSubmission(input: {
  name: string;
  email: string;
  message: string;
  newsletter: boolean;
  blocked?: boolean;
}): number {
  const result = db
    .prepare(
      "INSERT INTO submissions (name, email, message, newsletter, blocked) VALUES (?, ?, ?, ?, ?)"
    )
    .run(input.name, input.email, input.message, input.newsletter ? 1 : 0, input.blocked ? 1 : 0);
  return Number(result.lastInsertRowid);
}

export function markSubmissionEmailResult(
  id: number,
  emailed: boolean,
  error?: string
) {
  db.prepare(
    "UPDATE submissions SET emailed = ?, email_error = ? WHERE id = ?"
  ).run(emailed ? 1 : 0, error ?? null, id);
}

export function listSubmissions(includeBlocked = false): Submission[] {
  return db
    .prepare(includeBlocked ? "SELECT * FROM submissions ORDER BY id DESC" : "SELECT * FROM submissions WHERE blocked = 0 ORDER BY id DESC")
    .all() as Submission[];
}

export function getSubmission(id: number): Submission | undefined {
  return db.prepare("SELECT * FROM submissions WHERE id = ?").get(id) as Submission | undefined;
}

export function deleteSubmission(id: number) {
  db.prepare("DELETE FROM submissions WHERE id = ?").run(id);
}

export function unblockSubmission(id: number) {
  db.prepare("UPDATE submissions SET blocked = 0, emailed = 0, email_error = ? WHERE id = ? AND blocked = 1")
    .run("Unblocked; retry delivery when ready.", id);
}

export function countSubmissionsSince(days = 30): number {
  const row = db.prepare("SELECT COUNT(*) AS count FROM submissions WHERE blocked = 0 AND created_at >= datetime('now', ?)").get(`-${days} days`) as { count: number };
  return row.count;
}

export function countSubmissionsPeriod(startDaysAgo: number, endDaysAgo = 0): number {
  const row = db.prepare("SELECT COUNT(*) AS count FROM submissions WHERE blocked = 0 AND created_at >= datetime('now', ?) AND created_at < datetime('now', ?)").get(`-${startDaysAgo} days`, `-${endDaysAgo} days`) as { count: number };
  return row.count;
}
