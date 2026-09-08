import { NextRequest, NextResponse } from "next/server";
import { reorderByIds } from "@/lib/reorder";

export async function POST(request: NextRequest) {
  const { order } = (await request.json()) as { order?: string[] };
  if (Array.isArray(order)) {
    reorderByIds("homepage_sections", "key", order);
  }
  return NextResponse.json({ ok: true });
}
