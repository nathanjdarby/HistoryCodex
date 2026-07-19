import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { requireUser } from "@/lib/server/auth-context";
import { pauseReadingSession } from "@/lib/server/reading-sessions";

const bodySchema = z.object({ clientToken: z.string().min(1) });

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
    const session = await pauseReadingSession(user.id, bookId, sessionId, body.clientToken);
    return NextResponse.json({ session });
  } catch (error) {
    return handleApiError(error);
  }
}
