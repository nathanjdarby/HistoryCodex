import { NextResponse } from "next/server";
import { ApiError, handleApiError } from "@/lib/api-utils";
import { requireUser } from "@/lib/server/auth-context";

export async function POST() {
  try {
    await requireUser();
    throw new ApiError(
      403,
      "Cards cannot be purchased directly. Open booster packs to add them to your collection.",
    );
  } catch (error) {
    return handleApiError(error);
  }
}
