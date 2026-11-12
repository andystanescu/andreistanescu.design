import { db } from "@/lib/db";
import { deleteCategory } from "@/lib/categoryDeletion";
import { relativeRedirect } from "@/lib/relativeRedirect";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) return new Response("Invalid category", { status: 400 });
  db.exec("BEGIN IMMEDIATE");
  try {
    const deleted = deleteCategory(db, Number(id));
    db.exec("COMMIT");
    if (!deleted) return new Response("Not found", { status: 404 });
  } catch (error) {
    if (db.isTransaction) db.exec("ROLLBACK");
    throw error;
  }
  return relativeRedirect("/admin/categories");
}
