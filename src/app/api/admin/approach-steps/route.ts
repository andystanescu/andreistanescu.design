import { relativeRedirect } from "@/lib/relativeRedirect";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveImageField } from "@/lib/uploads";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const showOnHomepage = form.get("show_on_homepage") ? 1 : 0;
  const published = form.get("published") ? 1 : 0;

  if (!title || !description) {
    const url = new URL("/admin/approach-steps/new", request.url);
    url.searchParams.set("error", "Title and description are required.");
    return relativeRedirect(url.pathname + url.search);
  }

  const icon = await resolveImageField(form, "icon", "");

  const maxPosition = db
    .prepare("SELECT COALESCE(MAX(position), -1) AS max FROM approach_steps")
    .get() as { max: number };

  db.prepare(
    `INSERT INTO approach_steps (title, description, icon, show_on_homepage, position, published)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(title, description, icon, showOnHomepage, maxPosition.max + 1, published);

  return relativeRedirect("/admin/approach-steps");
}
