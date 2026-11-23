import { db } from "@/lib/db";
import { deleteCategory, protectUnmanagedServiceCategory } from "@/lib/categoryDeletion";
import { relativeRedirect } from "@/lib/relativeRedirect";
import { insightsAvailable } from "@/lib/features";
import { installedExtensions } from "@/platform/extensions/installed";
import { prepareCategoryDeletion } from "@/platform/extensions/contract";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) return new Response("Invalid category", { status: 400 });
  db.exec("BEGIN IMMEDIATE");
  try {
    const servicesManagesDeletion = installedExtensions.some((extension) => extension.id === "services" && extension.isEnabled() && typeof extension.categories?.beforeDelete === "function");
    const protection = protectUnmanagedServiceCategory(db, Number(id), servicesManagesDeletion);
    if (protection) {
      db.exec("ROLLBACK");
      return relativeRedirect(`/admin/categories?error=${encodeURIComponent(protection)}`);
    }
    if (!insightsAvailable() && db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='insights'").get()) {
      const migrated = db.prepare("SELECT 1 FROM settings WHERE key='insights_categories_v1'").get();
      const relationTable = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='insight_categories'").get();
      if (!migrated || !relationTable || db.prepare("SELECT 1 FROM insight_categories WHERE category_id = ?").get(Number(id))) {
        db.exec("ROLLBACK");
        return relativeRedirect("/admin/categories?error=Stored+article+content+may+reference+this+category.+Enable+Insights+to+review+before+deleting.");
      }
    }
    if (insightsAvailable()) { const { unlinkInsightsCategory } = await import("@/modules/insights/migration"); unlinkInsightsCategory(db, Number(id)); }
    const reason = prepareCategoryDeletion(installedExtensions, db, Number(id));
    if (reason) {
      db.exec("ROLLBACK");
      return relativeRedirect(`/admin/categories?error=${encodeURIComponent(reason)}`);
    }
    const deleted = deleteCategory(db, Number(id));
    db.exec("COMMIT");
    if (!deleted) return new Response("Not found", { status: 404 });
  } catch (error) {
    if (db.isTransaction) db.exec("ROLLBACK");
    throw error;
  }
  return relativeRedirect("/admin/categories");
}
