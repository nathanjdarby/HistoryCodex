import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { requireUser } from "@/lib/server/auth-context";
import { listCatalogBooks } from "@/lib/server/catalog-books";
import { listUserCatalogBookIds } from "@/lib/server/books";

export async function GET() {
  try {
    const user = await requireUser();
    const [catalog, inLibrary] = await Promise.all([
      listCatalogBooks({ activeOnly: true }),
      listUserCatalogBookIds(user.id),
    ]);

    return NextResponse.json(
      catalog.map((book) => ({
        ...book,
        inLibrary: inLibrary.has(book.id),
      })),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
