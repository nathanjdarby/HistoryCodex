import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { requireUser } from "@/lib/server/auth-context";
import { finalizeReadingSession } from "@/lib/server/reading-sessions";
import { getBook } from "@/lib/server/books";

const bodySchema = z
  .object({
    clientToken: z.string().min(1),
    endPage: z.number().int().min(0).optional(),
    endPositionSeconds: z.number().int().min(0).optional(),
  })
  .refine((data) => data.endPage !== undefined || data.endPositionSeconds !== undefined, {
    message: "Provide endPage or endPositionSeconds",
  });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> },
) {
  try {
    const user = await requireUser();
    const { id, sessionId: sessionIdParam } = await params;
    const bookId = Number(id);
    const sessionId = Number(sessionIdParam);
    if (!Number.isInteger(bookId) || !Number.isInteger(sessionId)) {
      throw new ApiError(400, "Invalid id");
    }

    const body = bodySchema.parse(await request.json());
    const book = await getBook(bookId, user.id);
    if (book.consumptionFormat === "audiobook" && body.endPositionSeconds === undefined) {
      throw new ApiError(400, "endPositionSeconds is required for audiobook sessions");
    }
    if (book.consumptionFormat !== "audiobook" && body.endPage === undefined) {
      throw new ApiError(400, "endPage is required for print and e-reader sessions");
    }

    const result = await finalizeReadingSession(
      user.id,
      bookId,
      sessionId,
      body.clientToken,
      {
        endPage: body.endPage,
        endPositionSeconds: body.endPositionSeconds,
      },
    );
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
