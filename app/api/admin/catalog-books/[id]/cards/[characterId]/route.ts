import { NextRequest, NextResponse } from "next/server";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { requireAdmin } from "@/lib/server/auth-context";
import { removeCatalogBookCard } from "@/lib/server/catalog-book-cards";

function parseId(idParam: string) {
  const id = Number(idParam);
  if (!Number.isInteger(id)) throw new ApiError(400, "Invalid id");
  return id;
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; characterId: string }> },
) {
  try {
    await requireAdmin();
    const { id, characterId } = await params;
    await removeCatalogBookCard(parseId(id), parseId(characterId));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
