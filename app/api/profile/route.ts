import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { requireUser } from "@/lib/server/auth-context";
import { getUserProfile, updateUserProfile, userProfileInputSchema } from "@/lib/server/user-profile";

export async function GET() {
  try {
    const user = await requireUser();
    const profile = await getUserProfile(user.id);
    return NextResponse.json(profile);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const input = userProfileInputSchema.parse(body);
    const profile = await updateUserProfile(user.id, input);
    return NextResponse.json(profile);
  } catch (error) {
    return handleApiError(error);
  }
}
