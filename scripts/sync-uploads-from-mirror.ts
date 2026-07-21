/**
 * Download missing local upload files referenced in the DB from UPLOAD_MIRROR_URL.
 *
 * Usage:
 *   UPLOAD_MIRROR_URL=https://your-production-host npx tsx scripts/sync-uploads-from-mirror.ts
 */
import { eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { boosterPacks, books, characters } from "@/db/schema";
import {
  cacheUploadFile,
  fetchUploadFromMirror,
  getUploadMirrorBase,
  resolveUploadFilePath,
} from "@/lib/server/upload-mirror";
import fs from "node:fs";
import path from "node:path";

function uploadPathFromUrl(url: string): string | null {
  const match = url.match(/^\/uploads\/(.+)$/);
  return match?.[1] ?? null;
}

async function collectReferencedUploadPaths(): Promise<string[]> {
  const [packRows, characterRows, bookRows] = await Promise.all([
    db
      .select({ imageUrl: boosterPacks.imageUrl })
      .from(boosterPacks)
      .where(isNotNull(boosterPacks.imageUrl)),
    db
      .select({ imageUrl: characters.imageUrl })
      .from(characters)
      .where(isNotNull(characters.imageUrl)),
    db
      .select({ coverUrl: books.coverUrl })
      .from(books)
      .where(isNotNull(books.coverUrl)),
  ]);

  const paths = new Set<string>();
  for (const row of packRows) {
    const relative = row.imageUrl ? uploadPathFromUrl(row.imageUrl) : null;
    if (relative) paths.add(relative);
  }
  for (const row of characterRows) {
    const relative = row.imageUrl ? uploadPathFromUrl(row.imageUrl) : null;
    if (relative?.startsWith("characters/") || relative?.startsWith("packs/") || relative?.startsWith("books/")) {
      paths.add(relative);
    }
  }
  for (const row of bookRows) {
    const relative = row.coverUrl ? uploadPathFromUrl(row.coverUrl) : null;
    if (relative?.startsWith("books/")) paths.add(relative);
  }

  return [...paths].sort();
}

async function main() {
  if (!getUploadMirrorBase()) {
    throw new Error("UPLOAD_MIRROR_URL is required (e.g. https://your-production-host).");
  }

  const paths = await collectReferencedUploadPaths();
  let downloaded = 0;
  let skipped = 0;
  let missing = 0;

  for (const relativePath of paths) {
    const segments = relativePath.split("/");
    const filePath = resolveUploadFilePath(segments);
    if (!filePath) continue;

    if (fs.existsSync(filePath)) {
      skipped += 1;
      continue;
    }

    const body = await fetchUploadFromMirror(relativePath);
    if (!body) {
      missing += 1;
      console.warn("Missing on mirror:", relativePath);
      continue;
    }

    cacheUploadFile(filePath, body);
    downloaded += 1;
    console.log("Downloaded:", relativePath);
  }

  console.log(
    `Done. ${downloaded} downloaded, ${skipped} already local, ${missing} not found on mirror (${paths.length} referenced).`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
