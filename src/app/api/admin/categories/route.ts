import { db } from "@/lib/db";
import { relativeRedirect } from "@/lib/relativeRedirect";

export async function POST(request: Request) {
  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  if (!name || name.length > 120) return relativeRedirect("/admin/categories?error=Enter+a+category+name.");
  if (db.prepare("SELECT 1 FROM category_legacy_names WHERE name = ? COLLATE NOCASE").get(name)) return relativeRedirect("/admin/categories?error=That+category+name+is+already+in+use.");
  try {
    db.exec("BEGIN IMMEDIATE");
    const result = db.prepare("INSERT INTO categories(name, position) VALUES (?, (SELECT COALESCE(MAX(position), -1) + 1 FROM categories))").run(name);
    db.prepare("INSERT INTO category_legacy_names(name, category_id) VALUES (?, ?)").run(name, result.lastInsertRowid);
    db.exec("COMMIT");
  }
  catch { if (db.isTransaction) db.exec("ROLLBACK"); return relativeRedirect("/admin/categories?error=That+category+already+exists."); }
  return relativeRedirect("/admin/categories");
}
