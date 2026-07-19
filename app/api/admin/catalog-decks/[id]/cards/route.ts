import { NextRequest, NextResponse } from "next/server";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { requireAdmin } from "@/lib/server/auth-context";
import { getCatalogDeck, validateCatalogDeckCards } from "@/lib/server/catalog-decks";
import {
  listCatalogDeckCards,
  setCatalogDeckCards,
  setCatalogDeckCardsSchema,
} from "@/lib/server/catalog-deck-cards";

function parseId(idParam: string) {
  const id = Number(idParam);
  if (!Number.isInteger(id)) throw new ApiError(400, "Invalid id");
  return id;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const cards = await listCatalogDeckCards(parseId(id));
    return NextResponse.json(cards);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const deckId = parseId(id);
    const body = await request.json();
    const { cards } = setCatalogDeckCardsSchema.parse(body);
    const saved = await setCatalogDeckCards(deckId, cards);
    const validation = await validateCatalogDeckCards(saved);
    const deck = await getCatalogDeck(deckId);
    return NextResponse.json({ cards: saved, validation, deck });
  } catch (error) {
    return handleApiError(error);
  }
}
