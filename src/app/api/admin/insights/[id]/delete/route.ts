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
    db.prepare("DELETE FROM insight_categories WHERE insight_id = ?").run(id);
    db.prepare("DELETE FROM insights WHERE id = ?").run(id);
    db.exec("COMMIT");
  } catch (error) { if (db.isTransaction) db.exec("ROLLBACK"); throw error; }
  return relativeRedirect("/admin/insights");
}
