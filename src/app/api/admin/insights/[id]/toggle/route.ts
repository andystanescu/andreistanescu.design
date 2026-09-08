import { relativeRedirect } from "@/lib/relativeRedirect";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  db.prepare(
    "UPDATE insights SET published = CASE WHEN published = 1 THEN 0 ELSE 1 END WHERE id = ?"
  ).run(id);

  return relativeRedirect("/admin/insights");
}
