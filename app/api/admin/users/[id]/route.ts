import { NextRequest, NextResponse } from "next/server";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { requireAdmin } from "@/lib/server/auth-context";
import {
  adminUserUpdateSchema,
  deleteUserForAdmin,
  getUserForAdmin,
  updateUserForAdmin,
} from "@/lib/server/users";

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
    await requireAdmin();
    const { id } = await params;
    const user = await getUserForAdmin(parseId(id));
    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actingUser = await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const input = adminUserUpdateSchema.parse(body);
    const updated = await updateUserForAdmin(parseId(id), input, actingUser.id);
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
    const actingUser = await requireAdmin();
    const { id } = await params;
    await deleteUserForAdmin(parseId(id), actingUser.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
