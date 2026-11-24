import { db } from "@/lib/db";
import { relativeRedirect } from "@/lib/relativeRedirect";

export async function POST(request: Request) {
  const form = await request.formData();
  const rawId = String(form.get("id") ?? "");
  const id = /^[1-9]\d*$/.test(rawId) ? Number(rawId) : null;
  const action = String(form.get("action") ?? "save");
  if (rawId && !id) return new Response("Invalid testimonial", { status: 400 });
  if (action === "delete" && id) {
    db.prepare("DELETE FROM testimonials WHERE id = ?").run(id);
  } else if (action === "toggle" && id) {
    db.prepare("UPDATE testimonials SET published = ? WHERE id = ?").run(Number(form.has("published")), id);
  } else if ((action === "up" || action === "down") && id) {
    const rows = db.prepare("SELECT id FROM testimonials ORDER BY position, id").all() as { id: number }[];
    const index = rows.findIndex((row) => row.id === id);
    const next = index + (action === "up" ? -1 : 1);
    if (index >= 0 && next >= 0 && next < rows.length) {
      [rows[index], rows[next]] = [rows[next], rows[index]];
      db.exec("BEGIN IMMEDIATE");
      try { const update = db.prepare("UPDATE testimonials SET position = ? WHERE id = ?"); rows.forEach((row, position) => update.run(position, row.id)); db.exec("COMMIT"); }
      catch (error) { db.exec("ROLLBACK"); throw error; }
    }
  } else if (action === "save") {
    const testimonial = String(form.get("testimonial") ?? "").trim();
    const name = String(form.get("name") ?? "").trim();
    const title = String(form.get("title_company") ?? "").trim();
    const source = String(form.get("source") ?? "").trim();
    if (!testimonial || !name || name.length > 200 || title.length > 300 || source.length > 1000) return relativeRedirect("/admin/testimonials?error=Enter+a+testimonial+and+name.");
    if (id) db.prepare("UPDATE testimonials SET testimonial = ?, name = ?, title_company = ?, source = ?, published = ? WHERE id = ?").run(testimonial, name, title, source, Number(form.has("published")), id);
    else db.prepare("INSERT INTO testimonials(testimonial, name, title_company, source, published, position) VALUES (?, ?, ?, ?, ?, (SELECT COALESCE(MAX(position), -1) + 1 FROM testimonials))").run(testimonial, name, title, source, Number(form.has("published")));
  } else return new Response("Invalid action", { status: 400 });
  return relativeRedirect("/admin/testimonials");
}
