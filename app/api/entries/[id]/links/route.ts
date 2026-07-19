import { NextRequest, NextResponse } from "next/server";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { requireUser } from "@/lib/server/auth-context";
import { createLink, linkInputSchema } from "@/lib/server/links";

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
    await requireUser();
    const { id } = await params;
    const body = await request.json();
    const input = linkInputSchema.parse(body);
    const created = await createLink(parseId(id), input);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
