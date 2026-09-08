import { relativeRedirect } from "@/lib/relativeRedirect";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { AboutItem } from "@/lib/about";
import { resolveImageField } from "@/lib/uploads";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const form = await request.formData();
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const published = form.get("published") ? 1 : 0;

  if (!title || !description) {
    const url = new URL(`/admin/about-highlights/${id}`, request.url);
    url.searchParams.set("error", "Title and description are required.");
    return relativeRedirect(url.pathname + url.search);
  }

  const existing = db
    .prepare("SELECT icon FROM about_highlight_items WHERE id = ?")
    .get(id) as Pick<AboutItem, "icon"> | undefined;

  const icon = await resolveImageField(form, "icon", existing?.icon ?? "");

  db.prepare(
    `UPDATE about_highlight_items
     SET title = ?, description = ?, icon = ?, published = ?
     WHERE id = ?`
  ).run(title, description, icon, published, id);

  return relativeRedirect("/admin/about-highlights");
}
