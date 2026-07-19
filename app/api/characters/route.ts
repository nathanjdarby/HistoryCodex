import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { requireAdmin, requireUser } from "@/lib/server/auth-context";
import { characterInputSchema, createCharacter, listCharacters } from "@/lib/server/characters";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const eraIdParam = request.nextUrl.searchParams.get("eraId");
    const eraId = eraIdParam ? Number(eraIdParam) : undefined;
    const data = await listCharacters(user.id, eraId);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const input = characterInputSchema.parse(body);
    const created = await createCharacter(input);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
