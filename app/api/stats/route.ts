import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { requireUser } from "@/lib/server/auth-context";
import { listUserEraStats } from "@/lib/server/era-points";
import { getUserStats } from "@/lib/server/stats";

export async function GET() {
  try {
    const user = await requireUser();
    const [stats, eraBalances] = await Promise.all([
      getUserStats(user.id),
      listUserEraStats(user.id),
    ]);
    return NextResponse.json({ ...stats, eraBalances });
  } catch (error) {
    return handleApiError(error);
  }
}
