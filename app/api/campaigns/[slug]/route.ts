import { NextResponse } from "next/server";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { requireUser } from "@/lib/server/auth-context";
import { getCampaignBySlug, getUserCampaignProgress } from "@/lib/server/campaigns";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const user = await requireUser();
    const { slug } = await params;

    const campaign = await getCampaignBySlug(slug);
    if (!campaign) {
      throw new ApiError(404, "Campaign not found");
    }

    const progress = await getUserCampaignProgress(user.id, campaign.eraId);

    return NextResponse.json({
      ...campaign,
      progress,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
