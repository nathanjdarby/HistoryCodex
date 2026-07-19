import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { requireAdmin } from "@/lib/server/auth-context";
import {
  assertValidGameRulesInput,
  describeEarnRules,
  getGameRules,
  updateGameRules,
} from "@/lib/server/game-rules";

export async function GET() {
  try {
    await requireAdmin();
    const rules = await getGameRules();
    return NextResponse.json({
      ...rules,
      summary: describeEarnRules(rules),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const input = assertValidGameRulesInput(body);
    const rules = await updateGameRules(input);
    return NextResponse.json({
      ...rules,
      summary: describeEarnRules(rules),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
