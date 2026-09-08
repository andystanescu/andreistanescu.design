import { NextRequest, NextResponse } from "next/server";
import { saveUploadedImage, UploadError } from "@/lib/uploads";

// Used by the rich text editor's image-insert button (interactive upload
// while composing, ahead of the surrounding form's own submit).
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  try {
    const url = await saveUploadedImage(file);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof UploadError ? err.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
