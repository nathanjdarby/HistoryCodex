import { NextRequest, NextResponse } from "next/server";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { requireUser } from "@/lib/server/auth-context";
import { deleteLink } from "@/lib/server/links";

function parseId(idParam: string) {
  const id = Number(idParam);
  if (!Number.isInteger(id)) throw new ApiError(400, "Invalid id");
  return id;
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> },
) {
  try {
    await requireUser();
    const { id, linkId } = await params;
    await deleteLink(parseId(id), parseId(linkId));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
