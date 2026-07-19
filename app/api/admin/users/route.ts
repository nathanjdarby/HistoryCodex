import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { requireAdmin } from "@/lib/server/auth-context";
import {
  adminUserInputSchema,
  createUserForAdmin,
  listUsersForAdmin,
} from "@/lib/server/users";

export async function GET() {
  try {
    await requireAdmin();
    const data = await listUsersForAdmin();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const input = adminUserInputSchema.parse(body);
    const created = await createUserForAdmin(input);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
