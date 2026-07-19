import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { requireUser } from "@/lib/server/auth-context";
import { getPackEligibility, listActivePackConfigsForShop, openPack } from "@/lib/server/packs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const packConfigIdParam = request.nextUrl.searchParams.get("packConfigId");
    if (!packConfigIdParam) {
      const data = await listActivePackConfigsForShop();
      return NextResponse.json(data);
    }
    const packConfigId = Number(packConfigIdParam);
    if (!Number.isInteger(packConfigId)) {
      throw new ApiError(400, "packConfigId is required");
    }
    const eligibility = await getPackEligibility(user.id, packConfigId);
    return NextResponse.json(eligibility);
  } catch (error) {
    return handleApiError(error);
  }
}

const packSchema = z.object({
  packConfigId: z.number().int(),
  paymentMethod: z.enum(["era", "general"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { packConfigId, paymentMethod } = packSchema.parse(body);
    const result = await openPack(user.id, packConfigId, paymentMethod);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
