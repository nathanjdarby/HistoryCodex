import { NextRequest, NextResponse } from "next/server";
import { ApiError, handleApiError } from "@/lib/api-utils";
import { requireAdmin } from "@/lib/server/auth-context";
import { stageImportFolderFiles } from "@/lib/server/stage-import-folder";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      throw new ApiError(
        413,
        "Upload too large. Restart the dev server after updating Next config, or try a smaller folder batch.",
      );
    }
    const sessionId = formData.get("sessionId");
    const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);
    const paths = formData
      .getAll("paths")
      .map((entry) => (typeof entry === "string" ? entry : ""))
      .filter(Boolean);

    if (files.length === 0) {
      return NextResponse.json({ error: "No files were uploaded." }, { status: 400 });
    }
    if (files.length !== paths.length) {
      return NextResponse.json({ error: "Uploaded files and paths do not match." }, { status: 400 });
    }

    const stagedFiles = await Promise.all(
      files.map(async (file, index) => ({
        relativePath: paths[index]!,
        buffer: Buffer.from(await file.arrayBuffer()),
      })),
    );

    const result = await stageImportFolderFiles({
      sessionId: typeof sessionId === "string" ? sessionId : null,
      files: stagedFiles,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
