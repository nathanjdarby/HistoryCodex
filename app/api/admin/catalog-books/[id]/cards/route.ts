import { NextRequest, NextResponse } from "next/server";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { requireAdmin } from "@/lib/server/auth-context";
import {
  addCatalogBookCard,
  addCatalogBookCardSchema,
  listCatalogBookCards,
  setCatalogBookCards,
  setCatalogBookCardsSchema,
} from "@/lib/server/catalog-book-cards";

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
    const cards = await listCatalogBookCards(parseId(id));
    return NextResponse.json(cards);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { characterId } = addCatalogBookCardSchema.parse(body);
    const cards = await addCatalogBookCard(parseId(id), characterId);
    return NextResponse.json(cards, { status: 201 });
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
    const body = await request.json();
    const { characterIds } = setCatalogBookCardsSchema.parse(body);
    const cards = await setCatalogBookCards(parseId(id), characterIds);
    return NextResponse.json(cards);
  } catch (error) {
    return handleApiError(error);
  }
}
