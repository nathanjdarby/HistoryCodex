import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { requireAdmin } from "@/lib/server/auth-context";
import { deleteArtworkFile } from "@/lib/server/artwork";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    await requireAdmin();
    const { filename } = await params;
    const force = request.nextUrl.searchParams.get("force") === "true";
    const result = await deleteArtworkFile(decodeURIComponent(filename), force);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
