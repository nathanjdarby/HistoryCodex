import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { requireUser } from "@/lib/server/auth-context";
import { searchBooks } from "@/lib/server/book-search";

/** @deprecated Use /api/book-search for combined Open Library + Google Books results. */
export async function GET(request: NextRequest) {
  try {
    await requireUser();
    const q = request.nextUrl.searchParams.get("q");
    const { results } = await searchBooks(q ?? "");
    return NextResponse.json(results);
  } catch (error) {
    return handleApiError(error);
  }
}
