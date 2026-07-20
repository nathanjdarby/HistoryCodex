import { NextRequest, NextResponse } from "next/server";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { requireUser } from "@/lib/server/auth-context";
import { getPackDetailForShop } from "@/lib/server/packs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const packConfigId = Number(id);
    if (!Number.isInteger(packConfigId) || packConfigId <= 0) {
      throw new ApiError(400, "Invalid pack id");
    }

    const detail = await getPackDetailForShop(user.id, packConfigId);
    return NextResponse.json(detail);
  } catch (error) {
    return handleApiError(error);
  }
}
