import fs from "node:fs";
import path from "node:path";
import { eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import {
  boosterPacks,
  books,
  catalogDecks,
  characters,
  timelineEntries,
} from "@/db/schema";
import {
  ensureStorageBucket,
  getPublicObjectUrl,
  isLocalUploadUrl,
  isSupabaseStorageEnabled,
  uploadObject,
} from "@/lib/server/supabase-storage";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");
const UPLOAD_KINDS = ["characters", "packs", "books"] as const;

function localPathFromUrl(url: string): string | null {
  const match = url.match(/^\/uploads\/(.+)$/);
  return match?.[1] ?? null;
}

async function collectReferencedLocalPaths(): Promise<Map<string, Set<number>>> {
  const [characterRows, packRows, bookRows, deckRows, entryRows] = await Promise.all([
    db.select({ id: characters.id, url: characters.imageUrl }).from(characters).where(isNotNull(characters.imageUrl)),
    db.select({ id: boosterPacks.id, url: boosterPacks.imageUrl }).from(boosterPacks).where(isNotNull(boosterPacks.imageUrl)),
    db.select({ id: books.id, url: books.coverUrl }).from(books).where(isNotNull(books.coverUrl)),
    db.select({ id: catalogDecks.id, url: catalogDecks.imageUrl }).from(catalogDecks).where(isNotNull(catalogDecks.imageUrl)),
    db.select({ id: timelineEntries.id, url: timelineEntries.imageUrl }).from(timelineEntries).where(isNotNull(timelineEntries.imageUrl)),
  ]);

  const pathToIds = new Map<string, Set<number>>();

  function addRows(rows: { id: number; url: string | null }[]) {
    for (const row of rows) {
      if (!row.url || !isLocalUploadUrl(row.url)) continue;
      const set = pathToIds.get(row.url) ?? new Set<number>();
      set.add(row.id);
      pathToIds.set(row.url, set);
    }
  }

  addRows(characterRows);
  addRows(packRows);
  addRows(bookRows);
  addRows(deckRows);
  addRows(entryRows);

  return pathToIds;
}

async function updateUrlReferences(oldUrl: string, newUrl: string) {
  await db.update(characters).set({ imageUrl: newUrl }).where(eq(characters.imageUrl, oldUrl));
  await db.update(boosterPacks).set({ imageUrl: newUrl }).where(eq(boosterPacks.imageUrl, oldUrl));
  await db.update(books).set({ coverUrl: newUrl }).where(eq(books.coverUrl, oldUrl));
  await db.update(catalogDecks).set({ imageUrl: newUrl }).where(eq(catalogDecks.imageUrl, oldUrl));
  await db.update(timelineEntries).set({ imageUrl: newUrl }).where(eq(timelineEntries.imageUrl, oldUrl));
}

async function uploadLocalFile(relativePath: string): Promise<string | null> {
  const filePath = path.join(UPLOAD_ROOT, relativePath);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return null;
  }

  const body = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType =
    ext === ".webp"
      ? "image/webp"
      : ext === ".png"
        ? "image/png"
        : ext === ".jpg" || ext === ".jpeg"
          ? "image/jpeg"
          : ext === ".gif"
            ? "image/gif"
            : "application/octet-stream";

  return uploadObject(relativePath.replace(/\\/g, "/"), body, contentType);
}

async function main() {
  if (!isSupabaseStorageEnabled()) {
    throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before migrating uploads.");
  }

  const { bucket, created } = await ensureStorageBucket();
  console.log(created ? `Created bucket: ${bucket}` : `Using existing bucket: ${bucket}`);

  const referenced = await collectReferencedLocalPaths();
  let uploaded = 0;
  let skipped = 0;
  let missing = 0;

  for (const [oldUrl, ids] of referenced) {
    const relativePath = localPathFromUrl(oldUrl);
    if (!relativePath) continue;

    const publicUrl = getPublicObjectUrl(relativePath);
    const uploadedUrl = await uploadLocalFile(relativePath);
    if (!uploadedUrl) {
      missing += 1;
      console.warn(`Missing local file for ${oldUrl} (${ids.size} DB reference(s))`);
      continue;
    }

    if (uploadedUrl !== oldUrl) {
      await updateUrlReferences(oldUrl, uploadedUrl);
    }

    uploaded += 1;
    console.log(`Uploaded ${relativePath} -> ${publicUrl}`);
  }

  for (const kind of UPLOAD_KINDS) {
    const kindDir = path.join(UPLOAD_ROOT, kind);
    if (!fs.existsSync(kindDir)) continue;

    for (const filename of fs.readdirSync(kindDir)) {
      const relativePath = `${kind}/${filename}`.replace(/\\/g, "/");
      const oldUrl = `/uploads/${relativePath}`;
      if (referenced.has(oldUrl)) continue;

      const uploadedUrl = await uploadLocalFile(relativePath);
      if (!uploadedUrl) {
        skipped += 1;
        continue;
      }

      uploaded += 1;
      console.log(`Uploaded unreferenced ${relativePath}`);
    }
  }

  console.log(
    `Done. ${uploaded} uploaded, ${missing} referenced files missing locally, ${skipped} skipped.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
