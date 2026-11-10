import { NextRequest, NextResponse } from "next/server";
import { updateSettings } from "@/lib/settings";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (body?.style !== "default" && body?.style !== "masthead" && body?.style !== "islands" && body?.style !== "menu-first" && body?.style !== "floating-rail") return NextResponse.json({ error: "Unknown navigation style." }, { status: 400 });
  updateSettings({ navigation_style: body.style });
  return NextResponse.json({ ok: true });
}
