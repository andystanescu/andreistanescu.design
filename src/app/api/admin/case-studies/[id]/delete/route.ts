import { relativeRedirect } from "@/lib/relativeRedirect";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare("DELETE FROM case_study_categories WHERE case_study_id = ?").run(id);
    db.prepare("DELETE FROM case_studies WHERE id = ?").run(id);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  return relativeRedirect("/admin/case-studies");
}
