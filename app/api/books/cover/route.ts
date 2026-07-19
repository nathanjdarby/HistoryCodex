import { NextRequest, NextResponse } from "next/server";
import { ApiError, handleApiError } from "@/lib/api-utils";
import { requireUser } from "@/lib/server/auth-context";
import { saveUploadedImage } from "@/lib/server/uploads";

export async function POST(request: NextRequest) {
  try {
    await requireUser();
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new ApiError(400, "No file provided");
    }

    const url = await saveUploadedImage(file, "books");
    return NextResponse.json({ url });
  } catch (error) {
    return handleApiError(error);
  }
}
