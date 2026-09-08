import { relativeRedirect } from "@/lib/relativeRedirect";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  db.prepare("DELETE FROM about_experiences WHERE id = ?").run(id);
  return relativeRedirect("/admin/about-experiences");
}
