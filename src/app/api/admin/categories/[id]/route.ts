import { db } from "@/lib/db";
import { relativeRedirect } from "@/lib/relativeRedirect";
import { insightsAvailable, servicesAvailable } from "@/lib/features";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (servicesAvailable()) {
    const { POST: saveCategoryAndService } = await import("@/lib/serviceCategoryEditor");
    return saveCategoryAndService(request, context);
  }
  const { id } = await context.params;
  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  if (!/^[1-9]\d*$/.test(id) || !name || name.length > 120) return relativeRedirect("/admin/categories?error=Enter+a+valid+category+name.");
  const previous = db.prepare("SELECT name, description FROM categories WHERE id = ?").get(Number(id)) as { name: string; description: string } | undefined;
  if (!previous) return new Response("Category not found", { status: 404 });
  const owner = db.prepare("SELECT category_id FROM category_legacy_names WHERE name = ? COLLATE NOCASE").get(name) as { category_id: number } | undefined;
  if (owner && owner.category_id !== Number(id)) return relativeRedirect("/admin/categories?error=That+category+name+is+already+in+use.");
  try {
    db.exec("BEGIN IMMEDIATE");
    db.prepare("UPDATE categories SET name = ?, description = ? WHERE id = ?").run(name, form.has("description") ? String(form.get("description") ?? "").trim() : previous.description, Number(id));
    db.prepare("INSERT OR IGNORE INTO category_legacy_names(name, category_id) VALUES (?, ?)").run(name, Number(id));
    db.prepare("UPDATE case_studies SET category = ? WHERE category = ? COLLATE NOCASE").run(name, previous.name);
    if (insightsAvailable()) { const { renameInsightCategory } = await import("@/modules/insights/migration"); renameInsightCategory(db, previous.name, name); }
    db.exec("COMMIT");
  } catch {
    if (db.isTransaction) db.exec("ROLLBACK");
    return relativeRedirect(`/admin/categories/${id}?error=That+category+name+is+already+in+use.`);
  }
  return relativeRedirect("/admin/categories");
}
