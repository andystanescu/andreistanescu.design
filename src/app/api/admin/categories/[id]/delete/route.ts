import { db } from "@/lib/db";
import { deleteCategory } from "@/lib/categoryDeletion";
import { relativeRedirect } from "@/lib/relativeRedirect";
import { insightsAvailable, servicesAvailable } from "@/lib/features";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) return new Response("Invalid category", { status: 400 });
  db.exec("BEGIN IMMEDIATE");
  try {
    if (!insightsAvailable() && db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='insights'").get()) {
      const migrated = db.prepare("SELECT 1 FROM settings WHERE key='insights_categories_v1'").get();
      const relationTable = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='insight_categories'").get();
      if (!migrated || !relationTable || db.prepare("SELECT 1 FROM insight_categories WHERE category_id = ?").get(Number(id))) {
        db.exec("ROLLBACK");
        return relativeRedirect("/admin/categories?error=Stored+article+content+may+reference+this+category.+Enable+Insights+to+review+before+deleting.");
      }
    }
    if (insightsAvailable()) { const { unlinkInsightsCategory } = await import("@/modules/insights/migration"); unlinkInsightsCategory(db, Number(id)); }
    const hasServiceTable = Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='service_items'").get());
    const hasCategoryLink = hasServiceTable && (db.prepare("PRAGMA table_info(service_items)").all() as Array<{ name: string }>).some((column) => column.name === "category_id");
    if (hasServiceTable && !servicesAvailable() && (!hasCategoryLink || db.prepare("SELECT 1 FROM service_items WHERE category_id = ?").get(Number(id)))) {
      db.exec("ROLLBACK");
      return relativeRedirect("/admin/categories?error=This+category+has+stored+service+content.+Enable+Services+to+review+and+delete+it.");
    }
    if (hasCategoryLink && servicesAvailable()) db.prepare("DELETE FROM service_items WHERE category_id = ?").run(Number(id));
    const deleted = deleteCategory(db, Number(id));
    db.exec("COMMIT");
    if (!deleted) return new Response("Not found", { status: 404 });
  } catch (error) {
    if (db.isTransaction) db.exec("ROLLBACK");
    throw error;
  }
  return relativeRedirect("/admin/categories");
}
