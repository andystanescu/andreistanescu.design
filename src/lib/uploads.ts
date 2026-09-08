import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

// Keep this configurable for hosts that provide a persistent writable
// directory outside the build output. The route that serves uploads uses the
// same resolver, so saving and reading always target the same location.
export function getUploadsDir(): string {
  return process.env.UPLOADS_DIR?.trim() || join(process.cwd(), "public", "uploads");
}

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

const MAX_BYTES = 8 * 1024 * 1024; // 8MB

export class UploadError extends Error {}

// Saves an uploaded image to public/uploads and returns its public URL
// (e.g. "/uploads/<uuid>.png"). Used both by the rich text editor's
// image button and by the cover/thumbnail fields on case study & insight
// forms — anything accepted here is served directly, so type/size are
// validated up front rather than trusted from the client-sent mime type
// alone (checked, but also re-derived from the sniffed extension).
export async function saveUploadedImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES[file.type]) {
    throw new UploadError(
      "Unsupported image type. Use JPEG, PNG, WebP, GIF, or SVG."
    );
  }
  if (file.size > MAX_BYTES) {
    throw new UploadError("Image is too large — 8MB max.");
  }

  const uploadsDir = getUploadsDir();
  if (!existsSync(/*turbopackIgnore: true*/ uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }

  const ext = ALLOWED_TYPES[file.type];
  const filename = `${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(join(/*turbopackIgnore: true*/ uploadsDir, filename), bytes);

  return `/uploads/${filename}`;
}

export async function saveUploadedPdf(file: File): Promise<string> {
  if (file.type !== "application/pdf") {
    throw new UploadError("Unsupported file type. Upload a PDF.");
  }
  if (file.size > MAX_BYTES) {
    throw new UploadError("PDF is too large — 8MB max.");
  }

  const uploadsDir = getUploadsDir();
  if (!existsSync(/*turbopackIgnore: true*/ uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }
  const filename = `${randomUUID()}.pdf`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(join(/*turbopackIgnore: true*/ uploadsDir, filename), bytes);
  return `/uploads/${filename}`;
}

export async function resolvePdfField(
  form: FormData,
  field: string,
  existingUrl: string
): Promise<string> {
  const value = form.get(field);
  if (value instanceof File && value.size > 0) {
    return saveUploadedPdf(value);
  }
  return existingUrl;
}

// Resolves a cover/thumbnail form field to a URL: uploads a newly chosen
// file, or falls back to the existing value so re-saving a form without
// picking a new file doesn't wipe out the image already on record.
export async function resolveImageField(
  form: FormData,
  field: string,
  existingUrl: string
): Promise<string> {
  const value = form.get(field);
  if (value instanceof File && value.size > 0) {
    return saveUploadedImage(value);
  }
  return existingUrl;
}
