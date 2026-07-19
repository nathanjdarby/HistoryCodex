import { NextResponse } from "next/server";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { requireUser } from "@/lib/server/auth-context";
import { listCampaignsForUser } from "@/lib/server/campaigns";

export async function GET() {
  try {
    const user = await requireUser();
    const campaigns = await listCampaignsForUser(user.id);
    return NextResponse.json(campaigns);
  } catch (error) {
    return handleApiError(error);
  }
}
