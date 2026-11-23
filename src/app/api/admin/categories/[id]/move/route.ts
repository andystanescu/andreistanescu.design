import { db } from "@/lib/db";
import { relativeRedirect } from "@/lib/relativeRedirect";
import { installedExtensions } from "@/platform/extensions/installed";
import { notifyCategoriesReordered } from "@/platform/extensions/contract";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const form = await request.formData();
  const direction = String(form.get("direction"));
  const rows = db.prepare("SELECT id FROM categories ORDER BY position, id").all() as Array<{ id: number }>;
  const index = rows.findIndex((row) => String(row.id) === id);
  const next = direction === "up" ? index - 1 : direction === "down" ? index + 1 : -1;
  if (index >= 0 && next >= 0 && next < rows.length) {
    [rows[index], rows[next]] = [rows[next], rows[index]];
    db.exec("BEGIN IMMEDIATE");
    try {
      const updateCategory = db.prepare("UPDATE categories SET position = ? WHERE id = ?");
      rows.forEach((row, position) => updateCategory.run(position, row.id));
      notifyCategoriesReordered(installedExtensions, db, rows.map(({ id }) => id));
      db.exec("COMMIT");
    } catch (error) { db.exec("ROLLBACK"); throw error; }
  }
  return relativeRedirect("/admin/categories");
}
