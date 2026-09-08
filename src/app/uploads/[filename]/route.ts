import { readFile } from "fs/promises";
import { basename, join } from "path";
import { getUploadsDir } from "@/lib/uploads";

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  pdf: "application/pdf",
};

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const safeFilename = basename(filename);
  if (safeFilename !== filename) return new Response("Not found", { status: 404 });

  try {
    const content = await readFile(join(getUploadsDir(), safeFilename));
    const extension = safeFilename.split(".").pop()?.toLowerCase() ?? "";
    return new Response(content, {
      headers: {
        "Content-Type": MIME_TYPES[extension] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
