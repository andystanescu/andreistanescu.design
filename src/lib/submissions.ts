import { db } from "@/lib/db";

export type Submission = {
  id: number;
  name: string;
  email: string;
  message: string;
  newsletter: number;
  emailed: number;
  email_error: string | null;
  created_at: string;
};

export function createSubmission(input: {
  name: string;
  email: string;
  message: string;
  newsletter: boolean;
}): number {
  const result = db
    .prepare(
      "INSERT INTO submissions (name, email, message, newsletter) VALUES (?, ?, ?, ?)"
    )
    .run(input.name, input.email, input.message, input.newsletter ? 1 : 0);
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

export function listSubmissions(): Submission[] {
  return db
    .prepare("SELECT * FROM submissions ORDER BY id DESC")
    .all() as Submission[];
}

export function countSubmissionsSince(days = 30): number {
  const row = db.prepare("SELECT COUNT(*) AS count FROM submissions WHERE created_at >= datetime('now', ?)").get(`-${days} days`) as { count: number };
  return row.count;
}
