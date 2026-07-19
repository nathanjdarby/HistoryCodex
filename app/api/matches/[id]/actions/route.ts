import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { requireUser } from "@/lib/server/auth-context";
import { applyMatchAction } from "@/lib/server/matches";
import type { BattleAction } from "@/lib/battle/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const action = (await request.json()) as BattleAction;
    const match = await applyMatchAction(user.id, Number(id), action);
    return NextResponse.json(match);
  } catch (error) {
    return handleApiError(error);
  }
}
