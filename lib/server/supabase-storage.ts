import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isLocalUploadUrl as isLocalUploadPath } from "@/lib/upload-urls";

export type UploadKind = "characters" | "packs" | "books";

export const DEFAULT_STORAGE_BUCKET = "historycodex-uploads";

let adminClient: SupabaseClient | null | undefined;

export function getSupabaseUrl(): string | null {
  const explicit = process.env.SUPABASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const databaseUrl = process.env.DATABASE_URL ?? process.env.DATABASE_URL_DIRECT;
  if (!databaseUrl) return null;

  const match = databaseUrl.match(/postgres(?:ql)?:\/\/postgres\.([a-z0-9]+):/i);
  if (!match?.[1]) return null;

  return `https://${match[1]}.supabase.co`;
}

export function getStorageBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || DEFAULT_STORAGE_BUCKET;
}

export function isSupabaseStorageEnabled(): boolean {
  return Boolean(getSupabaseUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient !== undefined) return adminClient!;

  const url = getSupabaseUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) {
    adminClient = null;
    throw new Error(
      "Supabase Storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  adminClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

export function getPublicObjectUrl(storagePath: string): string {
  const base = getSupabaseUrl();
  if (!base) {
    throw new Error("SUPABASE_URL is required to build public upload URLs.");
  }
  const normalized = storagePath.replace(/^\/+/, "");
  return `${base}/storage/v1/object/public/${getStorageBucket()}/${normalized}`;
}

export function isSupabasePublicUploadUrl(url: string): boolean {
  const base = getSupabaseUrl();
  if (!base || !url.startsWith(`${base}/storage/v1/object/public/${getStorageBucket()}/`)) {
    return false;
  }
  return true;
}

export function isLocalUploadUrl(url: string): boolean {
  return isLocalUploadPath(url);
}

export function isHostedUploadUrl(url: string): boolean {
  return isLocalUploadUrl(url) || isSupabasePublicUploadUrl(url);
}

export function localUploadPath(url: string): string | null {
  const match = url.match(/^\/uploads\/(.+)$/);
  return match?.[1] ?? null;
}

export function storagePathFromUploadUrl(url: string): string | null {
  if (isLocalUploadUrl(url)) {
    return localUploadPath(url);
  }

  const base = getSupabaseUrl();
  const bucket = getStorageBucket();
  if (!base) return null;

  const prefix = `${base}/storage/v1/object/public/${bucket}/`;
  if (!url.startsWith(prefix)) return null;
  return url.slice(prefix.length);
}

export function resolveUploadUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  const storagePath = localUploadPath(url);
  if (storagePath && isSupabaseStorageEnabled()) {
    return getPublicObjectUrl(storagePath);
  }

  return url;
}

export async function ensureStorageBucket() {
  const supabase = getSupabaseAdmin();
  const bucket = getStorageBucket();

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;

  if (buckets.some((entry) => entry.name === bucket)) {
    const existing = buckets.find((entry) => entry.name === bucket);
    if (existing && !existing.public) {
      const { error: updateError } = await supabase.storage.updateBucket(bucket, { public: true });
      if (updateError) throw updateError;
    }
    return { bucket, created: false };
  }

  const { error: createError } = await supabase.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
  });
  if (createError) throw createError;

  return { bucket, created: true };
}

export async function uploadObject(
  storagePath: string,
  body: Buffer,
  contentType = "image/webp",
): Promise<string> {
  const supabase = getSupabaseAdmin();
  const bucket = getStorageBucket();
  const normalized = storagePath.replace(/^\/+/, "");

  const { error } = await supabase.storage.from(bucket).upload(normalized, body, {
    contentType,
    upsert: true,
    cacheControl: "31536000",
  });
  if (error) throw error;

  return getPublicObjectUrl(normalized);
}

export async function uploadKindObject(
  kind: UploadKind,
  filename: string,
  body: Buffer,
  contentType = "image/webp",
): Promise<string> {
  return uploadObject(`${kind}/${filename}`, body, contentType);
}

export async function downloadObject(storagePath: string): Promise<Buffer | null> {
  const supabase = getSupabaseAdmin();
  const bucket = getStorageBucket();
  const normalized = storagePath.replace(/^\/+/, "");

  const { data, error } = await supabase.storage.from(bucket).download(normalized);
  if (error || !data) return null;

  return Buffer.from(await data.arrayBuffer());
}

export async function deleteObject(storagePath: string) {
  const supabase = getSupabaseAdmin();
  const bucket = getStorageBucket();
  const normalized = storagePath.replace(/^\/+/, "");

  const { error } = await supabase.storage.from(bucket).remove([normalized]);
  if (error) throw error;
}

export async function listObjects(prefix: string) {
  const supabase = getSupabaseAdmin();
  const bucket = getStorageBucket();
  const normalizedPrefix = prefix.replace(/^\/+|\/+$/g, "");

  const files: { name: string; path: string; sizeBytes: number; updatedAt: string | null }[] = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(normalizedPrefix, {
      limit,
      offset,
      sortBy: { column: "updated_at", order: "desc" },
    });
    if (error) throw error;
    if (!data?.length) break;

    for (const item of data) {
      if (!item.name || item.id == null) continue;
      files.push({
        name: item.name,
        path: normalizedPrefix ? `${normalizedPrefix}/${item.name}` : item.name,
        sizeBytes: item.metadata?.size ?? 0,
        updatedAt: item.updated_at ?? item.created_at ?? null,
      });
    }

    if (data.length < limit) break;
    offset += limit;
  }

  return files;
}
