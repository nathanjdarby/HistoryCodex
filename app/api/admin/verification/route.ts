import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { requireAdmin } from "@/lib/server/auth-context";
import { countPendingVerifications, listPendingVerifications } from "@/lib/server/verification";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    if (request.nextUrl.searchParams.get("countOnly") === "1") {
      const pendingCount = await countPendingVerifications();
      return NextResponse.json({ pendingCount });
    }
    const items = await listPendingVerifications();
    return NextResponse.json(items);
  } catch (error) {
    return handleApiError(error);
  }
}
