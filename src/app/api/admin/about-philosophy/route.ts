import { relativeRedirect } from "@/lib/relativeRedirect";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveImageField } from "@/lib/uploads";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const published = form.get("published") ? 1 : 0;

  if (!title || !description) {
    const url = new URL("/admin/about-philosophy/new", request.url);
    url.searchParams.set("error", "Title and description are required.");
    return relativeRedirect(url.pathname + url.search);
  }

  const icon = await resolveImageField(form, "icon", "");

  const maxPosition = db
    .prepare("SELECT COALESCE(MAX(position), -1) AS max FROM about_philosophy_items")
    .get() as { max: number };

  db.prepare(
    `INSERT INTO about_philosophy_items (title, description, icon, position, published)
     VALUES (?, ?, ?, ?, ?)`
  ).run(title, description, icon, maxPosition.max + 1, published);

  return relativeRedirect("/admin/about-philosophy");
}
