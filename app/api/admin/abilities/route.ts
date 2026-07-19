import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { requireAdmin } from "@/lib/server/auth-context";
import { getAbilityAdminCatalog } from "@/lib/server/abilities-admin";

export async function GET() {
  try {
    await requireAdmin();
    const catalog = await getAbilityAdminCatalog();
    return NextResponse.json(catalog);
  } catch (error) {
    return handleApiError(error);
  }
}
