import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { requireUser } from "@/lib/server/auth-context";
import {
  deckInputSchema,
  deleteUserDeck,
  getUserDeck,
  updateUserDeck,
} from "@/lib/server/decks";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const deck = await getUserDeck(user.id, Number(id));
    return NextResponse.json(deck);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();
    const input = deckInputSchema.partial().parse(body);
    const deck = await updateUserDeck(user.id, Number(id), input);
    return NextResponse.json(deck);
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
    await deleteUserDeck(user.id, Number(id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
