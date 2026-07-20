import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { requireAdmin } from "@/lib/server/auth-context";
import { convertArtworkFileToWebp } from "@/lib/server/artwork";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    await requireAdmin();
    const { filename } = await params;
    const result = await convertArtworkFileToWebp(decodeURIComponent(filename));
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
