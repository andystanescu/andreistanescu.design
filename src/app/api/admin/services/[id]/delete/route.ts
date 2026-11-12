import { relativeRedirect } from "@/lib/relativeRedirect";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;
  return relativeRedirect("/admin/categories");
}
