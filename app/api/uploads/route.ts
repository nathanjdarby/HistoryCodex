import { NextRequest, NextResponse } from "next/server";
import { ApiError, handleApiError } from "@/lib/api-utils";
import { requireAdmin } from "@/lib/server/auth-context";
import { saveUploadedImage } from "@/lib/server/uploads";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new ApiError(400, "No file provided");
    }

    const kindField = formData.get("kind");
    const kind =
      kindField === "pack" || kindField === "packs"
        ? "packs"
        : kindField === "book" || kindField === "books"
          ? "books"
          : "characters";
    const url = await saveUploadedImage(file, kind);
    return NextResponse.json({ url });
  } catch (error) {
    return handleApiError(error);
  }
}
