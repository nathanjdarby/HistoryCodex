import fs from "node:fs";
import path from "node:path";
import { eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { ApiError } from "@/lib/api-utils";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "characters");
const URL_PREFIX = "/uploads/characters/";

async function usageMap(): Promise<Map<string, { id: number; name: string }[]>> {
  const rows = await db
    .select({ id: characters.id, name: characters.name, imageUrl: characters.imageUrl })
    .from(characters)
    .where(isNotNull(characters.imageUrl));

  const map = new Map<string, { id: number; name: string }[]>();
  for (const row of rows) {
    if (!row.imageUrl) continue;
    const list = map.get(row.imageUrl) ?? [];
    list.push({ id: row.id, name: row.name });
    map.set(row.imageUrl, list);
  }
  return map;
}

export async function listArtwork() {
  let filenames: string[];
  try {
    filenames = fs.readdirSync(UPLOAD_DIR);
  } catch {
    return { files: [], totalBytes: 0, unusedCount: 0 };
  }

  const usage = await usageMap();
  let totalBytes = 0;
  let unusedCount = 0;

  const files = filenames.map((filename) => {
    const stat = fs.statSync(path.join(UPLOAD_DIR, filename));
    const url = `${URL_PREFIX}${filename}`;
    const usedBy = usage.get(url) ?? [];
    totalBytes += stat.size;
    if (usedBy.length === 0) unusedCount++;
    return {
      filename,
      url,
      sizeBytes: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      usedBy,
    };
  });

  files.sort((a, b) => (a.modifiedAt < b.modifiedAt ? 1 : -1));

  return { files, totalBytes, unusedCount };
}

function assertSafeFilename(filename: string) {
  if (
    filename.includes("/") ||
    filename.includes("\\") ||
    filename.includes("..") ||
    path.basename(filename) !== filename
  ) {
    throw new ApiError(400, "Invalid filename");
  }
}

export async function deleteArtworkFile(filename: string, force: boolean) {
  assertSafeFilename(filename);
  const filePath = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, "File not found");
  }

  const url = `${URL_PREFIX}${filename}`;
  const usage = await usageMap();
  const usedBy = usage.get(url) ?? [];

  if (usedBy.length > 0 && !force) {
    throw new ApiError(409, `In use by ${usedBy.map((c) => c.name).join(", ")}`);
  }

  if (usedBy.length > 0) {
    await db.update(characters).set({ imageUrl: null }).where(eq(characters.imageUrl, url));
  }

  fs.unlinkSync(filePath);
  return { nulledCharacterIds: usedBy.map((c) => c.id) };
}
