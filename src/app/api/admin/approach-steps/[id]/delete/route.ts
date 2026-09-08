import { relativeRedirect } from "@/lib/relativeRedirect";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  db.prepare("DELETE FROM approach_steps WHERE id = ?").run(id);
  return relativeRedirect("/admin/approach-steps");
}
