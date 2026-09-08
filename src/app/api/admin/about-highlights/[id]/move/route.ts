import { relativeRedirect } from "@/lib/relativeRedirect";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const form = await request.formData();
  const direction = String(form.get("direction") ?? "");

  const current = db
    .prepare("SELECT id, position FROM about_highlight_items WHERE id = ?")
    .get(id) as { id: number; position: number } | undefined;

  if (current) {
    const neighbor = db
      .prepare(
        direction === "up"
          ? "SELECT id, position FROM about_highlight_items WHERE position < ? ORDER BY position DESC LIMIT 1"
          : "SELECT id, position FROM about_highlight_items WHERE position > ? ORDER BY position ASC LIMIT 1"
      )
      .get(current.position) as { id: number; position: number } | undefined;

    if (neighbor) {
      const update = db.prepare(
        "UPDATE about_highlight_items SET position = ? WHERE id = ?"
      );
      update.run(neighbor.position, current.id);
      update.run(current.position, neighbor.id);
    }
  }

  return relativeRedirect("/admin/about-highlights");
}
