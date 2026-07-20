import fs from "node:fs";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

const MIME_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
};

function resolveUploadPath(segments: string[]) {
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

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await context.params;
  const filePath = resolveUploadPath(segments);

  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = path.extname(filePath).toLowerCase();
  const body = fs.readFileSync(filePath);

  return new NextResponse(body, {
    headers: {
      "Content-Type": MIME_TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
