import { NextRequest, NextResponse } from "next/server";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { requireAdmin } from "@/lib/server/auth-context";
import { approveVerification, rejectVerification } from "@/lib/server/verification";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const queueId = Number(id);
    if (!Number.isInteger(queueId)) throw new ApiError(400, "Invalid id");

    const body = await request.json();
    const action = body.action as "approve" | "reject";
    if (action !== "approve" && action !== "reject") {
      throw new ApiError(400, "action must be approve or reject");
    }

    const result =
      action === "approve"
        ? await approveVerification(queueId, admin.id)
        : await rejectVerification(queueId, admin.id);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
