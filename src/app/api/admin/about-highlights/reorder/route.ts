import { NextRequest, NextResponse } from "next/server";
import { reorderByIds } from "@/lib/reorder";

export async function POST(request: NextRequest) {
  const { order } = (await request.json()) as { order?: string[] };
  if (Array.isArray(order)) {
    reorderByIds("about_highlight_items", "id", order.map(Number));
  }
  return NextResponse.json({ ok: true });
}
