import { db } from "@/lib/db";
import { relativeRedirect } from "@/lib/relativeRedirect";
import { setDedicatedService } from "@/lib/serviceCategoryOperations";
import { resolveImageField } from "@/lib/uploads";
import { SERVICE_TEMPLATES } from "@/lib/serviceItems";
import { parseServiceSectionOverrides } from "@/lib/serviceSectionContent";
import { parseServiceSectionSettings } from "@/lib/serviceSectionSettings";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  if (!/^[1-9]\d*$/.test(id) || !name || name.length > 120) return relativeRedirect("/admin/categories?error=Enter+a+valid+category+name.");
  const previous = db.prepare("SELECT name, description FROM categories WHERE id = ?").get(Number(id)) as { name: string; description: string } | undefined;
  if (!previous) return new Response("Category not found", { status: 404 });
  const isEditor = form.has("service_editor");
  const enabled = form.has("service_enabled");
  const description = form.has("description") ? String(form.get("description") ?? "").trim() : previous.description;
  const template = String(form.get("template_key") ?? "custom");
  if (isEditor && enabled && !SERVICE_TEMPLATES.some(([key]) => key === template)) return relativeRedirect(`/admin/categories/${id}?error=Invalid+template.`);
  const existing = db.prepare("SELECT id, slug, icon, section_content, section_settings FROM service_items WHERE category_id = ?").get(Number(id)) as { id: number; slug: string; icon: string; section_content: string; section_settings: string } | undefined;
  const icon = isEditor && enabled ? await resolveImageField(form, "icon", existing?.icon ?? "") : existing?.icon ?? "";
  const owner = db.prepare("SELECT category_id FROM category_legacy_names WHERE name = ? COLLATE NOCASE").get(name) as { category_id: number } | undefined;
  if (owner && owner.category_id !== Number(id)) return relativeRedirect("/admin/categories?error=That+category+name+is+already+in+use.");
  try {
    db.exec("BEGIN IMMEDIATE");
    db.prepare("UPDATE categories SET name = ?, description = ? WHERE id = ?").run(name, description, Number(id));
    db.prepare("INSERT OR IGNORE INTO category_legacy_names(name, category_id) VALUES (?, ?)").run(name, Number(id));
    // Legacy display fields remain in use until Insights and Services migrate.
    db.prepare("UPDATE case_studies SET category = ? WHERE category = ? COLLATE NOCASE").run(name, previous.name);
    db.prepare("UPDATE insights SET category = ? WHERE category = ? COLLATE NOCASE").run(name, previous.name);
    db.prepare("UPDATE service_items SET title = ?, description = ? WHERE category_id = ?").run(name, description, Number(id));
    if (isEditor) {
      setDedicatedService(db, Number(id), enabled);
      if (enabled) {
        const service = db.prepare("SELECT slug FROM service_items WHERE category_id = ?").get(Number(id)) as { slug: string };
        const slug = String(form.get("slug") ?? "").trim() || service.slug;
        db.prepare(`UPDATE service_items SET slug = ?, title = ?, description = ?, icon = ?, show_on_homepage = ?, template_key = ?, hero_lead = ?, hero_description = ?, section_content = ?, section_settings = ? WHERE category_id = ?`)
          .run(slug, name, description, icon, Number(form.has("show_on_homepage")), template, String(form.get("hero_lead") ?? "").trim(), String(form.get("hero_description") ?? "").trim(), form.has("section_content") ? JSON.stringify(parseServiceSectionOverrides(String(form.get("section_content") ?? "{}"))) : existing?.section_content ?? "{}", form.has("section_settings") ? JSON.stringify(parseServiceSectionSettings(String(form.get("section_settings") ?? "{}"))) : existing?.section_settings ?? "{}", Number(id));
      }
    }
    db.exec("COMMIT");
  } catch {
    if (db.isTransaction) db.exec("ROLLBACK");
    return relativeRedirect(`/admin/categories/${id}?error=That+category+name+or+service+URL+is+already+in+use.`);
  }
  return relativeRedirect("/admin/categories");
}
