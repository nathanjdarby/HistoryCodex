import fs from "node:fs";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { requireAdmin } from "@/lib/server/auth-context";
import { resolveStagedImportPreviewFile } from "@/lib/server/stage-import-folder";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const session = request.nextUrl.searchParams.get("session");
    const previewPath = request.nextUrl.searchParams.get("path");
    if (!session || !previewPath) {
      return NextResponse.json({ error: "Missing preview parameters." }, { status: 400 });
    }

    const { filePath, contentType } = resolveStagedImportPreviewFile(session, previewPath);
    const body = fs.readFileSync(filePath);

    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
