import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { requireUser } from "@/lib/server/auth-context";
import { deleteMatch, getMatchForClient } from "@/lib/server/matches";

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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await deleteMatch(user.id, Number(id));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
