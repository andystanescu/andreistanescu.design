import { relativeRedirect } from "@/lib/relativeRedirect";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveImageField } from "@/lib/uploads";
import { applyHeadingAccents } from "@/lib/headingAccents";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const slug = String(form.get("slug") ?? "").trim();
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const body = applyHeadingAccents(String(form.get("body") ?? "").trim());
  const showOnHomepage = form.get("show_on_homepage") ? 1 : 0;
  const published = form.get("published") ? 1 : 0;
  const cardSize = form.get("card_size") === "on" ? "large" : "standard";

  if (!slug || !title || !description) {
    const url = new URL("/admin/services/new", request.url);
    url.searchParams.set("error", "Slug, title, and description are required.");
    return relativeRedirect(url.pathname + url.search);
  }

  const icon = await resolveImageField(form, "icon", "");

  const maxPosition = db
    .prepare("SELECT COALESCE(MAX(position), -1) AS max FROM service_items")
    .get() as { max: number };

  try {
    db.prepare(
      `INSERT INTO service_items (slug, title, description, icon, body, show_on_homepage, position, published, card_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      slug,
      title,
      description,
      icon,
      body,
      showOnHomepage,
      maxPosition.max + 1,
      published,
      cardSize
    );
  } catch {
    const url = new URL("/admin/services/new", request.url);
    url.searchParams.set("error", `A service with slug "${slug}" already exists.`);
    return relativeRedirect(url.pathname + url.search);
  }

  return relativeRedirect("/admin/services");
}
