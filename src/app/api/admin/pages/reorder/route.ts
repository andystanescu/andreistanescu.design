import { NextRequest, NextResponse } from "next/server";
import { reorderByIds } from "@/lib/reorder";
import { getMainNavPages } from "@/lib/pages";

export async function POST(request: NextRequest) {
  const { order } = (await request.json().catch(() => ({}))) as { order?: unknown };
  const eligible = getMainNavPages().filter((page) => page.visible && page.slug !== "approach").map((page) => page.slug);
  if (!Array.isArray(order) || order.length !== eligible.length || new Set(order).size !== eligible.length || !order.every((item) => typeof item === "string" && eligible.includes(item))) return NextResponse.json({ error: "Navigation changed. Refresh and try again." }, { status: 400 });
  reorderByIds("pages", "slug", order);
  return NextResponse.json({ ok: true });
}
