import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { requireUser } from "@/lib/server/auth-context";
import {
  getUserTimelinesProfile,
  setUserTimelines,
  userTimelinesInputSchema,
} from "@/lib/server/user-eras";

export async function GET() {
  try {
    const user = await requireUser();
    const profile = await getUserTimelinesProfile(user.id);
    return NextResponse.json(profile);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { eraIds } = userTimelinesInputSchema.parse(body);
    const profile = await setUserTimelines(user.id, eraIds);
    return NextResponse.json(profile);
  } catch (error) {
    return handleApiError(error);
  }
}
