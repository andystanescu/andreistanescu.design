import { relativeRedirect } from "@/lib/relativeRedirect";
import { NextRequest, NextResponse } from "next/server";
import { moveSectionPosition } from "@/lib/homepage";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const form = await request.formData();
  const direction = String(form.get("direction") ?? "");

  if (direction === "up" || direction === "down") {
    moveSectionPosition(key, direction);
  }

  return relativeRedirect("/admin/homepage");
}
