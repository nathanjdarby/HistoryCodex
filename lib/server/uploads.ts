import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ApiError } from "@/lib/api-utils";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/gif": ".gif",
  "image/webp": ".webp",
};

export type UploadKind = "characters" | "packs" | "books";

export async function saveUploadedImage(file: File, kind: UploadKind): Promise<string> {
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    throw new ApiError(400, "Image must be PNG, JPEG, GIF, or WebP");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new ApiError(400, "Image must be under 5MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${randomUUID()}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", kind);
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.writeFileSync(path.join(uploadDir, filename), buffer);

  return `/uploads/${kind}/${filename}`;
}
