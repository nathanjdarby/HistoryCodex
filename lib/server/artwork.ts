import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { ApiError } from "@/lib/api-utils";
import {
  convertFileToWebp,
  isWebpFilename,
  webpFilenameFrom,
} from "@/lib/server/image-webp";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "characters");
const URL_PREFIX = "/uploads/characters/";

export type ArtworkConversionResult = {
  oldFilename: string;
  newFilename: string;
  oldUrl: string;
  newUrl: string;
  oldSizeBytes: number;
  newSizeBytes: number;
  updatedCharacterIds: number[];
};

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
    return { files: [], totalBytes: 0, unusedCount: 0, nonWebpCount: 0 };
  }

  const usage = await usageMap();
  let totalBytes = 0;
  let unusedCount = 0;
  let nonWebpCount = 0;

  const files = filenames.map((filename) => {
    const stat = fs.statSync(path.join(UPLOAD_DIR, filename));
    const url = `${URL_PREFIX}${filename}`;
    const usedBy = usage.get(url) ?? [];
    totalBytes += stat.size;
    if (usedBy.length === 0) unusedCount++;
    if (!isWebpFilename(filename)) nonWebpCount++;
    return {
      filename,
      url,
      sizeBytes: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      usedBy,
      isWebp: isWebpFilename(filename),
    };
  });

  files.sort((a, b) => (a.modifiedAt < b.modifiedAt ? 1 : -1));

  return { files, totalBytes, unusedCount, nonWebpCount };
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

function resolveWebpDestination(filename: string) {
  let newFilename = webpFilenameFrom(filename);
  let newPath = path.join(UPLOAD_DIR, newFilename);
  if (fs.existsSync(newPath)) {
    const base = path.basename(filename, path.extname(filename));
    newFilename = `${base}-${randomUUID().slice(0, 8)}.webp`;
    newPath = path.join(UPLOAD_DIR, newFilename);
  }
  return { newFilename, newPath };
}

export async function convertArtworkFileToWebp(filename: string): Promise<ArtworkConversionResult> {
  assertSafeFilename(filename);
  if (isWebpFilename(filename)) {
    throw new ApiError(400, "File is already WebP");
  }

  const oldPath = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(oldPath)) {
    throw new ApiError(404, "File not found");
  }

  const oldUrl = `${URL_PREFIX}${filename}`;
  const oldSizeBytes = fs.statSync(oldPath).size;
  const usage = await usageMap();
  const usedBy = usage.get(oldUrl) ?? [];

  const { newFilename, newPath } = resolveWebpDestination(filename);
  const newUrl = `${URL_PREFIX}${newFilename}`;

  const newSizeBytes = await convertFileToWebp(oldPath, newPath);

  if (usedBy.length > 0) {
    await db.update(characters).set({ imageUrl: newUrl }).where(eq(characters.imageUrl, oldUrl));
  }

  fs.unlinkSync(oldPath);

  return {
    oldFilename: filename,
    newFilename,
    oldUrl,
    newUrl,
    oldSizeBytes,
    newSizeBytes,
    updatedCharacterIds: usedBy.map((c) => c.id),
  };
}

export async function convertAllArtworkToWebp() {
  let filenames: string[];
  try {
    filenames = fs.readdirSync(UPLOAD_DIR);
  } catch {
    return { converted: [] as ArtworkConversionResult[], errors: [] as { filename: string; error: string }[] };
  }

  const converted: ArtworkConversionResult[] = [];
  const errors: { filename: string; error: string }[] = [];

  for (const filename of filenames) {
    if (isWebpFilename(filename)) continue;
    try {
      converted.push(await convertArtworkFileToWebp(filename));
    } catch (error) {
      errors.push({
        filename,
        error: error instanceof Error ? error.message : "Conversion failed",
      });
    }
  }

  return { converted, errors };
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
