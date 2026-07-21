import fs from "node:fs";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { resolveUploadBody, resolveUploadFilePath } from "@/lib/server/upload-mirror";
import { getPublicObjectUrl, isSupabaseStorageEnabled } from "@/lib/server/supabase-storage";

const MIME_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await context.params;
  const relativePath = segments.join("/");
  const filePath = resolveUploadFilePath(segments);

  if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const body = fs.readFileSync(filePath);
    return new NextResponse(body, {
      headers: {
        "Content-Type": MIME_TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  if (isSupabaseStorageEnabled()) {
    return NextResponse.redirect(getPublicObjectUrl(relativePath), 307);
  }

  const resolved = await resolveUploadBody(segments);
  if (!resolved) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = path.extname(resolved.filePath).toLowerCase();
  return new NextResponse(resolved.body, {
    headers: {
      "Content-Type": MIME_TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
