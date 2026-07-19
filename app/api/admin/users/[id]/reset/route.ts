import { NextResponse } from "next/server";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { requireAdmin } from "@/lib/server/auth-context";
import { resetUserForAdmin } from "@/lib/server/users";

function parseId(idParam: string) {
  const id = Number(idParam);
  if (!Number.isInteger(id)) throw new ApiError(400, "Invalid id");
  return id;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const user = await resetUserForAdmin(parseId(id));
    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error);
  }
}
