import fs from "node:fs";
import path from "node:path";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

export function getUploadMirrorBase(): string | null {
  const mirror = process.env.UPLOAD_MIRROR_URL?.trim();
  if (!mirror) return null;
  return mirror.replace(/\/$/, "");
}

export function resolveUploadFilePath(segments: string[]): string | null {
  const relative = segments.join("/");
  if (!relative || relative.includes("..")) {
    return null;
  }

  const filePath = path.resolve(UPLOAD_ROOT, relative);
  if (filePath !== UPLOAD_ROOT && !filePath.startsWith(`${UPLOAD_ROOT}${path.sep}`)) {
    return null;
  }

  return filePath;
}

export async function fetchUploadFromMirror(relativePath: string): Promise<Buffer | null> {
  const mirror = getUploadMirrorBase();
  if (!mirror) return null;

  const url = `${mirror}/uploads/${relativePath.split(path.sep).join("/")}`;
  const res = await fetch(url);
  if (!res.ok) return null;

  return Buffer.from(await res.arrayBuffer());
}

export function cacheUploadFile(filePath: string, body: Buffer) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, body);
}

export async function resolveUploadBody(
  segments: string[],
): Promise<{ body: Buffer; filePath: string } | null> {
  const filePath = resolveUploadFilePath(segments);
  if (!filePath) return null;

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return { body: fs.readFileSync(filePath), filePath };
  }

  const relativePath = segments.join("/");
  const mirrored = await fetchUploadFromMirror(relativePath);
  if (!mirrored) return null;

  cacheUploadFile(filePath, mirrored);
  return { body: mirrored, filePath };
}
