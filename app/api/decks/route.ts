import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { requireUser } from "@/lib/server/auth-context";
import { createUserDeck, deckInputSchema, listUserDecks } from "@/lib/server/decks";

export async function GET() {
  try {
    const user = await requireUser();
    const decks = await listUserDecks(user.id);
    return NextResponse.json(decks);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const input = deckInputSchema.parse(body);
    const deck = await createUserDeck(user.id, input);
    return NextResponse.json(deck, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
