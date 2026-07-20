import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ApiError } from "@/lib/api-utils";
import { bufferToWebp } from "@/lib/server/image-webp";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);

export type UploadKind = "characters" | "packs" | "books";

export async function saveUploadedImage(file: File, kind: UploadKind): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new ApiError(400, "Image must be PNG, JPEG, GIF, or WebP");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new ApiError(400, "Image must be under 5MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const webpBuffer = await bufferToWebp(buffer);
  const filename = `${randomUUID()}.webp`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", kind);
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.writeFileSync(path.join(uploadDir, filename), webpBuffer);

  return `/uploads/${kind}/${filename}`;
}
