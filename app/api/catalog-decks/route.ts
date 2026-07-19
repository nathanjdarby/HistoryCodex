import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { requireUser } from "@/lib/server/auth-context";
import { listPlayStarterDecks } from "@/lib/server/starter-decks";

export async function GET() {
  try {
    await requireUser();
    const decks = await listPlayStarterDecks();
    return NextResponse.json(
      decks.map((deck) => ({
        id: deck.id,
        name: deck.name,
        description: deck.description,
        eraId: deck.eraId,
        eraName: deck.eraName,
        deckKind: deck.deckKind,
        totalCards: deck.totalCards,
        valid: deck.valid,
      })),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
