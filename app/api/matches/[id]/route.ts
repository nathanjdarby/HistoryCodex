import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { requireUser } from "@/lib/server/auth-context";
import { getMatchForClient } from "@/lib/server/matches";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const match = await getMatchForClient(user.id, Number(id));
    return NextResponse.json(match);
  } catch (error) {
    return handleApiError(error);
  }
}
