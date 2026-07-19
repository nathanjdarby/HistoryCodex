import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { requireUser } from "@/lib/server/auth-context";
import { adoptStarterDeck } from "@/lib/server/starter-decks";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const catalogDeckId = Number(id);
    if (!Number.isInteger(catalogDeckId) || catalogDeckId <= 0) {
      return NextResponse.json({ error: "Invalid deck id" }, { status: 400 });
    }

    const deck = await adoptStarterDeck(user.id, catalogDeckId);
    return NextResponse.json(deck, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
