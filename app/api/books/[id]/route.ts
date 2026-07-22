import { NextRequest, NextResponse } from "next/server";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { requireUser } from "@/lib/server/auth-context";
import { getBook, removeBookFromLibrary, updateBookSettings, updateBookSettingsSchema } from "@/lib/server/books";
import { listCatalogBookCardsForUser } from "@/lib/server/catalog-book-cards";
import { describeEarnRules, getGameRules } from "@/lib/server/game-rules";
import { getBookLinksForUser } from "@/lib/server/links";
import { getBookMilestones } from "@/lib/server/points";

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
    const user = await requireUser();
    const { id } = await params;
    const bookId = parseId(id);
    const book = await getBook(bookId, user.id);
    const [links, cards, rules, milestoneRows] = await Promise.all([
      getBookLinksForUser(bookId, user.id),
      listCatalogBookCardsForUser(book.catalogBookId, user.id),
      getGameRules(),
      getBookMilestones(user.id, bookId),
    ]);
    const earnedMilestones = milestoneRows
      .map((row) => Number(row.type.replace("milestone_", "")))
      .filter((value) => Number.isFinite(value));
    return NextResponse.json({
      ...book,
      ...links,
      cards,
      readingRules: describeEarnRules(rules).readingMilestones,
      earnedMilestones,
    });
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
    const bookId = parseId(id);
    const body = await request.json();
    const input = updateBookSettingsSchema.parse(body);
    const updated = await updateBookSettings(bookId, user.id, input);
    return NextResponse.json(updated);
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
    await removeBookFromLibrary(parseId(id), user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
