import { relativeRedirect } from "@/lib/relativeRedirect";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SERVICE_TEMPLATES, type ServiceItem } from "@/lib/serviceItems";
import { resolveImageField } from "@/lib/uploads";
import { applyHeadingAccents } from "@/lib/headingAccents";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const form = await request.formData();
  const slug = String(form.get("slug") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const showOnHomepage = form.get("show_on_homepage") ? 1 : 0;
  const cardSize = form.get("card_size") === "on" ? "large" : "standard";
  const template = String(form.get("template_key") ?? "custom");
  const heroLead = String(form.get("hero_lead") ?? "").trim();
  const heroDescription = String(form.get("hero_description") ?? "").trim();

  if (!slug || !description || !SERVICE_TEMPLATES.some(([key]) => key === template)) {
    const url = new URL(`/admin/services/${id}`, request.url);
    url.searchParams.set("error", "Slug and description are required.");
    return relativeRedirect(url.pathname + url.search);
  }

  const existing = db
    .prepare("SELECT icon, body FROM service_items WHERE id = ?")
    .get(id) as Pick<ServiceItem, "icon" | "body"> | undefined;
  if (!existing) return new NextResponse("Service not found", { status: 404 });

  const icon = await resolveImageField(form, "icon", existing?.icon ?? "");

  try {
    db.prepare(
      `UPDATE service_items
       SET slug = ?, description = ?, icon = ?, body = ?, show_on_homepage = ?, card_size = ?, template_key = ?, hero_lead = ?, hero_description = ?
       WHERE id = ?`
    ).run(slug, description, icon, form.has("body") ? applyHeadingAccents(String(form.get("body") ?? "").trim()) : existing.body, showOnHomepage, cardSize, template, heroLead, heroDescription, id);
    db.prepare("UPDATE categories SET description = ? WHERE id = (SELECT category_id FROM service_items WHERE id = ?)").run(description, id);
  } catch {
    const url = new URL(`/admin/services/${id}`, request.url);
    url.searchParams.set("error", `A service with slug "${slug}" already exists.`);
    return relativeRedirect(url.pathname + url.search);
  }

  return relativeRedirect("/admin/categories");
}
