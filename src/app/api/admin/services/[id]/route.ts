import { relativeRedirect } from "@/lib/relativeRedirect";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { ServiceItem } from "@/lib/serviceItems";
import { resolveImageField } from "@/lib/uploads";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const form = await request.formData();
  const slug = String(form.get("slug") ?? "").trim();
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const showOnHomepage = form.get("show_on_homepage") ? 1 : 0;
  const published = form.get("published") ? 1 : 0;
  const cardSize = form.get("card_size") === "on" ? "large" : "standard";

  if (!slug || !title || !description) {
    const url = new URL(`/admin/services/${id}`, request.url);
    url.searchParams.set("error", "Slug, title, and description are required.");
    return relativeRedirect(url.pathname + url.search);
  }

  const existing = db
    .prepare("SELECT icon, body FROM service_items WHERE id = ?")
    .get(id) as Pick<ServiceItem, "icon" | "body"> | undefined;

  const icon = await resolveImageField(form, "icon", existing?.icon ?? "");

  try {
    db.prepare(
      `UPDATE service_items
       SET slug = ?, title = ?, description = ?, icon = ?, body = ?, show_on_homepage = ?, published = ?, card_size = ?
       WHERE id = ?`
    ).run(slug, title, description, icon, existing?.body ?? "", showOnHomepage, published, cardSize, id);
  } catch {
    const url = new URL(`/admin/services/${id}`, request.url);
    url.searchParams.set("error", `A service with slug "${slug}" already exists.`);
    return relativeRedirect(url.pathname + url.search);
  }

  return relativeRedirect("/admin/services");
}
