import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { requireAdmin } from "@/lib/server/auth-context";
import { listArtwork } from "@/lib/server/artwork";

export async function GET() {
  try {
    await requireAdmin();
    const data = await listArtwork();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
