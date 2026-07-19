import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { requireAdmin } from "@/lib/server/auth-context";
import {
  catalogBookInputSchema,
  createCatalogBook,
  listCatalogBooks,
} from "@/lib/server/catalog-books";

export async function GET() {
  try {
    await requireAdmin();
    const data = await listCatalogBooks();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const input = catalogBookInputSchema.parse(body);
    const created = await createCatalogBook(input);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
