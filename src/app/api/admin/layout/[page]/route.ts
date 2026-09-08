import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getLayoutConfiguration } from "@/lib/layoutConfiguration";
import { isLayoutPage } from "@/lib/layoutDraft";

export async function POST(request: Request, { params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  if (!isLayoutPage(page)) return NextResponse.json({ error: "Unknown page." }, { status: 404 });
  if (request.headers.get("sec-fetch-site") === "cross-site") return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid layout." }, { status: 400 }); }
  if (!body || !Array.isArray(body.sections) || typeof body.revision !== "string") return NextResponse.json({ error: "Invalid layout." }, { status: 400 });
  db.exec("BEGIN IMMEDIATE");
  try {
    const current = getLayoutConfiguration(page);
    if (current.revision !== body.revision) {
      db.exec("ROLLBACK");
      return NextResponse.json({ error: "The layout changed in another tab. Reload this page before saving." }, { status: 409 });
    }
    const incoming: unknown[] = body.sections;
    const valid = incoming.length === current.sections.length && incoming.every((item, index) => {
      if (!item || typeof item !== "object" || !("key" in item) || !("visible" in item) || typeof item.visible !== "boolean") return false;
      const stored = current.sections.find((section) => section.key === item.key);
      return stored && (!stored.fixed || (current.sections[index].key === stored.key && item.visible === stored.visible));
    });
    const sections = incoming as { key: string; visible: boolean }[];
    if (!valid || new Set(sections.map((section) => section.key)).size !== sections.length) {
      db.exec("ROLLBACK");
      return NextResponse.json({ error: "Invalid sections or fixed section position." }, { status: 400 });
    }
    const table = page === "homepage" ? "homepage_sections" : "about_sections";
    const update = db.prepare(`UPDATE ${table} SET position = ?, visible = ? WHERE key = ?`);
    sections.forEach((section, index) => update.run(index, Number(section.visible), section.key));
    const saved = getLayoutConfiguration(page);
    db.exec("COMMIT");
    revalidatePath(page === "homepage" ? "/" : "/about");
    revalidatePath(`/admin/${page}`);
    return NextResponse.json(saved);
  } catch (error) {
    if (db.isTransaction) db.exec("ROLLBACK");
    console.error("Layout save failed", error);
    return NextResponse.json({ error: "The layout could not be saved. Your draft is still available." }, { status: 500 });
  }
}
