import { db } from "@/lib/db";

export async function POST(request: Request) {
  const { order } = await request.json() as { order?: unknown };
  if (!Array.isArray(order) || order.some((id) => !/^[1-9]\d*$/.test(String(id)))) return new Response("Invalid order", { status: 400 });
  const ids = order.map(Number);
  const existing = db.prepare("SELECT id FROM categories").all() as Array<{ id: number }>;
  if (new Set(ids).size !== ids.length || ids.length !== existing.length || existing.some(({ id }) => !ids.includes(id))) return new Response("Incomplete order", { status: 400 });
  db.exec("BEGIN IMMEDIATE");
  try {
    const updateCategory = db.prepare("UPDATE categories SET position = ? WHERE id = ?");
    const updateService = db.prepare("UPDATE service_items SET position = ? WHERE category_id = ?");
    ids.forEach((id, index) => { updateCategory.run(index, id); updateService.run(index, id); });
    db.exec("COMMIT");
  } catch (error) { db.exec("ROLLBACK"); throw error; }
  return Response.json({ saved: true });
}
