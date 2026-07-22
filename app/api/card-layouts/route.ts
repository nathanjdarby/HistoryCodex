import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { getCardLayoutBundle } from "@/lib/server/card-layouts";

export async function GET() {
  try {
    const bundle = await getCardLayoutBundle();
    return NextResponse.json(bundle, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
