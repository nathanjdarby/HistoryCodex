import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { requireUser } from "@/lib/server/auth-context";
import { readingSessionsRequired } from "@/lib/server/feature-flags";
import { updateBookProgress } from "@/lib/server/points";
import { getBook } from "@/lib/server/books";
import { getGameRules } from "@/lib/server/game-rules";

const progressSchema = z.object({ currentPage: z.number().int().min(0) });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const bookId = Number(id);
    if (!Number.isInteger(bookId)) throw new ApiError(400, "Invalid id");

    const body = await request.json();
    const { currentPage } = progressSchema.parse(body);

    if (readingSessionsRequired()) {
      throw new ApiError(
        400,
        "Manual progress cannot award points. Start a reading session and finalize when done.",
      );
    }

    const book = await getBook(bookId, user.id);
    const rules = await getGameRules();
    const jump = currentPage - book.currentPage;
    if (jump >= rules.bulkPageJumpThreshold) {
      throw new ApiError(
        400,
        "Large page jumps require a reading session. Start a session, read, then finalize with your page.",
      );
    }

    const result = await updateBookProgress(user.id, bookId, currentPage);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
