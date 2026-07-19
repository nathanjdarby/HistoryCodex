import { NextRequest, NextResponse } from "next/server";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { requireUser } from "@/lib/server/auth-context";
import { getBook } from "@/lib/server/books";
import {
  createLink,
  getCompanionEntryForBook,
  linkInputSchema,
} from "@/lib/server/links";

function parseId(idParam: string) {
  const id = Number(idParam);
  if (!Number.isInteger(id)) throw new ApiError(400, "Invalid id");
  return id;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const bookId = parseId(id);
    await getBook(bookId, user.id);

    const companion = await getCompanionEntryForBook(bookId);
    if (!companion) throw new ApiError(404, "Book has no timeline entry");

    const body = await request.json();
    const input = linkInputSchema.parse(body);
    const created = await createLink(companion.id, input);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
