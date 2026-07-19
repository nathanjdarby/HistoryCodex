import { NextRequest, NextResponse } from "next/server";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { requireUser } from "@/lib/server/auth-context";
import { getActiveSessionForBook, startReadingSession } from "@/lib/server/reading-sessions";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const bookId = Number(id);
    if (!Number.isInteger(bookId)) throw new ApiError(400, "Invalid id");

    const session = await getActiveSessionForBook(user.id, bookId);
    return NextResponse.json({ session });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const bookId = Number(id);
    if (!Number.isInteger(bookId)) throw new ApiError(400, "Invalid id");

    const session = await startReadingSession(user.id, bookId);
    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
