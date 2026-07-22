import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { getBulkJumpThreshold } from "@/lib/book-progress";
import { requireUser } from "@/lib/server/auth-context";
import { readingSessionsRequired } from "@/lib/server/feature-flags";
import { getBook } from "@/lib/server/books";
import { getGameRules } from "@/lib/server/game-rules";
import { getCurrentProgressValue, updateBookProgress } from "@/lib/server/points";

const progressSchema = z
  .object({
    currentPage: z.number().int().min(0).optional(),
    currentPositionSeconds: z.number().int().min(0).optional(),
  })
  .refine(
    (data) => data.currentPage !== undefined || data.currentPositionSeconds !== undefined,
    { message: "Provide currentPage or currentPositionSeconds" },
  );

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
    const input = progressSchema.parse(body);

    if (readingSessionsRequired()) {
      throw new ApiError(
        400,
        "Manual progress cannot award points. Start a reading session and finalize when done.",
      );
    }

    const book = await getBook(bookId, user.id);
    const rules = await getGameRules();
    const currentValue = getCurrentProgressValue(book);
    const nextValue =
      book.consumptionFormat === "audiobook"
        ? input.currentPositionSeconds!
        : input.currentPage!;
    const jump = nextValue - currentValue;
    const threshold = getBulkJumpThreshold(book, rules.bulkPageJumpThreshold);
    if (jump >= threshold) {
      throw new ApiError(
        400,
        "Large progress jumps require a reading session. Start a session, read or listen, then finalize.",
      );
    }

    const result = await updateBookProgress(user.id, bookId, input);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
