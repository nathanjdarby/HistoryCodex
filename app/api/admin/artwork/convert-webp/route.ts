import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { requireAdmin } from "@/lib/server/auth-context";
import { convertAllArtworkToWebp } from "@/lib/server/artwork";

export async function POST() {
  try {
    await requireAdmin();
    const result = await convertAllArtworkToWebp();
    const savedBytes = result.converted.reduce(
      (sum, item) => sum + (item.oldSizeBytes - item.newSizeBytes),
      0,
    );
    return NextResponse.json({ ok: true, savedBytes, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
