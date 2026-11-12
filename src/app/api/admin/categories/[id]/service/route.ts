import { db } from "@/lib/db";
import { relativeRedirect } from "@/lib/relativeRedirect";
import { setDedicatedService } from "@/lib/serviceCategoryOperations";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) return new Response("Invalid category", { status: 400 });
  const form = await request.formData();
  const enabled = form.get("enabled") === "1";
  const category = db.prepare("SELECT id FROM categories WHERE id = ?").get(Number(id));
  if (!category) return new Response("Category not found", { status: 404 });
  try {
    db.exec("BEGIN IMMEDIATE");
    setDedicatedService(db, Number(id), enabled);
    db.exec("COMMIT");
  } catch (error) {
    if (db.isTransaction) db.exec("ROLLBACK");
    throw error;
  }
  return relativeRedirect("/admin/categories");
}
