import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { requireAdmin } from "@/lib/server/auth-context";
import {
  catalogDeckInputSchema,
  createCatalogDeck,
  listCatalogDecks,
} from "@/lib/server/catalog-decks";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const deckKind = request.nextUrl.searchParams.get("deckKind");
    const data = await listCatalogDecks({
      deckKind:
        deckKind === "starter" || deckKind === "themed" ? deckKind : undefined,
    });
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const input = catalogDeckInputSchema.parse(body);
    const created = await createCatalogDeck(input);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
