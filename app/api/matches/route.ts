import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/api-utils";
import { requireUser } from "@/lib/server/auth-context";
import { createMatch, listMatches } from "@/lib/server/matches";

const createSchema = z.object({ deckId: z.number().int().positive() });

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await listMatches(user.id);
    return NextResponse.json(rows);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { deckId } = createSchema.parse(body);
    const match = await createMatch(user.id, deckId);
    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
