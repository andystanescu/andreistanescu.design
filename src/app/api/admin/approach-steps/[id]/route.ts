import { relativeRedirect } from "@/lib/relativeRedirect";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { ApproachStep } from "@/lib/approachSteps";
import { resolveImageField } from "@/lib/uploads";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const form = await request.formData();
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const showOnHomepage = form.get("show_on_homepage") ? 1 : 0;
  const published = form.get("published") ? 1 : 0;

  if (!title || !description) {
    const url = new URL(`/admin/approach-steps/${id}`, request.url);
    url.searchParams.set("error", "Title and description are required.");
    return relativeRedirect(url.pathname + url.search);
  }

  const existing = db
    .prepare("SELECT icon FROM approach_steps WHERE id = ?")
    .get(id) as Pick<ApproachStep, "icon"> | undefined;

  const icon = await resolveImageField(form, "icon", existing?.icon ?? "");

  db.prepare(
    `UPDATE approach_steps
     SET title = ?, description = ?, icon = ?, show_on_homepage = ?, published = ?
     WHERE id = ?`
  ).run(title, description, icon, showOnHomepage, published, id);

  return relativeRedirect("/admin/approach-steps");
}
