import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/api-utils";
import { requireAdmin } from "@/lib/server/auth-context";
import { importCatalogBookCardsFromDir } from "@/lib/server/import-catalog-book-cards";
import { RARITY_ENUM } from "@/db/schema";

const importSchema = z
  .object({
    dir: z.string().min(1),
    eraSlug: z.string().min(1).optional(),
    bookTitle: z.string().min(1).max(300).optional(),
    bookId: z.number().int().positive().optional(),
    createBook: z.boolean().optional(),
    defaultRarity: z.enum(RARITY_ENUM).optional(),
    mergeLinks: z.boolean().optional(),
    dryRun: z.boolean().optional(),
    scanOnly: z.boolean().optional(),
    duplicatePolicy: z.enum(["replace", "ignore"]).optional(),
    duplicateDecisions: z.record(z.string(), z.enum(["replace", "ignore"])).optional(),
  })
  .refine((data) => Boolean(data.eraSlug || data.bookId), {
    message: "Choose a catalog book or provide an era slug.",
  });

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = importSchema.parse(await request.json());
    const result = await importCatalogBookCardsFromDir(body);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
