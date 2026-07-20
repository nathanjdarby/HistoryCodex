import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  CARD_TYPE_ENUM,
  catalogBooks,
  characters,
  eras,
} from "@/db/schema";
import { ApiError, slugify } from "@/lib/api-utils";
import { computeDefaultBattleStats, computeDefaultLocationBuff } from "@/lib/battle";
import {
  addCatalogBookCard,
  listCatalogBookCards,
  setCatalogBookCards,
} from "@/lib/server/catalog-book-cards";
import { createCatalogBook, getCatalogBook } from "@/lib/server/catalog-books";
import { convertFileToWebp } from "@/lib/server/image-webp";
import type { Archetype, Rarity } from "@/lib/sprite/generateSprite";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

const CARD_TYPE_FOLDER_ALIASES: Record<string, (typeof CARD_TYPE_ENUM)[number]> = {
  character: "character",
  characters: "character",
  unit: "unit",
  units: "unit",
  location: "location",
  locations: "location",
  event: "event",
  events: "event",
};

const CARD_TYPE_IMPORT_ORDER: (typeof CARD_TYPE_ENUM)[number][] = [
  "character",
  "unit",
  "event",
  "location",
];

const costByRarity: Record<Rarity, number> = {
  common: 20,
  uncommon: 40,
  rare: 75,
  epic: 150,
  legendary: 300,
  mythic: 450,
};

export type CardImportOverride = {
  rarity?: Rarity;
  archetype?: Archetype | null;
  flavorText?: string | null;
  cost?: number;
  cardType?: (typeof CARD_TYPE_ENUM)[number];
  /** Era slug for this card — used when importing into a multi-era book. */
  eraSlug?: string;
};

export type ImportDuplicateDecision = "replace" | "ignore";

export type ImportCardPreview = {
  key: string;
  name: string;
  cardType: (typeof CARD_TYPE_ENUM)[number];
  seed: string;
  sourcePath: string;
  status: "new" | "existing";
  eraId: number;
  eraSlug: string;
  existingCharacterId?: number;
  existingImageUrl?: string | null;
  matchedBy?: "seed" | "name";
};

export type ImportCatalogBookCardsOptions = {
  dir: string;
  eraSlug?: string;
  bookTitle?: string;
  bookId?: number;
  createBook?: boolean;
  /** When true, the catalog book stays without a single era; each card resolves its own era. */
  multiEra?: boolean;
  defaultRarity?: Rarity;
  mergeLinks?: boolean;
  dryRun?: boolean;
  scanOnly?: boolean;
  duplicatePolicy?: ImportDuplicateDecision;
  duplicateDecisions?: Record<string, ImportDuplicateDecision>;
};

export type ImportCatalogBookCardsResult = {
  bookId: number;
  bookTitle: string;
  eraSlug: string;
  imported: number;
  created: number;
  updated: number;
  linked: number;
  skipped: number;
  needsConfirmation?: boolean;
  duplicates?: ImportCardPreview[];
  newCards?: ImportCardPreview[];
  cards: {
    name: string;
    cardType: string;
    seed: string;
    action: "created" | "updated" | "skipped" | "linked_existing";
  }[];
};

type ImportContext = {
  absDir: string;
  defaultEra: typeof eras.$inferSelect | null;
  multiEra: boolean;
  book: Awaited<ReturnType<typeof getCatalogBook>> | Awaited<ReturnType<typeof createCatalogBook>>;
  bookSlug: string;
  defaultRarity: Rarity;
  defaults: CardImportOverride;
  byName: Map<string, CardImportOverride>;
  eraBySlug: Map<string, typeof eras.$inferSelect>;
  previews: ImportCardPreview[];
};

function slugifyCardName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/æ/gi, "ae")
    .replace(/þ/gi, "th")
    .replace(/ð/gi, "d")
    .replace(/ø/gi, "o")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function cardSeed(bookSlug: string, cardType: (typeof CARD_TYPE_ENUM)[number], name: string) {
  const base = slugifyCardName(name) || slugify(name);
  if (base) return `${bookSlug}-${cardType}-${base}`;
  const hash = createHash("sha256").update(name).digest("hex").slice(0, 12);
  return `${bookSlug}-${cardType}-${hash}`;
}

function cardNameFromFilename(filename: string) {
  return path.basename(filename, path.extname(filename)).trim();
}

function parseCardTypeFolder(folderName: string) {
  return CARD_TYPE_FOLDER_ALIASES[folderName.trim().toLowerCase()] ?? null;
}

function loadMetadataFile(dir: string): {
  defaults: CardImportOverride;
  byName: Map<string, CardImportOverride>;
} {
  const metadataPath = path.join(dir, "cards.json");
  if (!fs.existsSync(metadataPath)) {
    return { defaults: {}, byName: new Map() };
  }

  const parsed = JSON.parse(fs.readFileSync(metadataPath, "utf8")) as Record<string, unknown>;
  const defaults = (parsed.defaults ?? {}) as CardImportOverride;
  const byName = new Map<string, CardImportOverride>();

  for (const [key, value] of Object.entries(parsed)) {
    if (key === "defaults" || typeof value !== "object" || value == null) continue;
    byName.set(key, value as CardImportOverride);
  }

  return { defaults, byName };
}

async function importImageFile(sourcePath: string) {
  const ext = path.extname(sourcePath).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(ext)) {
    throw new Error(`Unsupported image type: ${sourcePath}`);
  }

  const filename = `${randomUUID()}.webp`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "characters");
  const destination = path.join(uploadDir, filename);
  fs.mkdirSync(uploadDir, { recursive: true });
  await convertFileToWebp(sourcePath, destination);
  return `/uploads/characters/${filename}`;
}

function buildCharacterValues(params: {
  eraId: number;
  name: string;
  seed: string;
  cardType: (typeof CARD_TYPE_ENUM)[number];
  override: CardImportOverride;
  defaultRarity: Rarity;
  imageUrl: string;
}) {
  const rarity = params.override.rarity ?? params.defaultRarity;
  const cost = params.override.cost ?? costByRarity[rarity];
  const archetype = params.override.archetype ?? null;
  const flavorText = params.override.flavorText ?? null;

  if (params.cardType === "location") {
    return {
      eraId: params.eraId,
      name: params.name,
      seed: params.seed,
      cardType: params.cardType,
      rarity,
      cost,
      archetype: null,
      attack: 0,
      defense: 0,
      flavorText,
      imageUrl: params.imageUrl,
      ...computeDefaultLocationBuff(rarity),
    };
  }

  if (params.cardType === "event") {
    return {
      eraId: params.eraId,
      name: params.name,
      seed: params.seed,
      cardType: params.cardType,
      rarity,
      cost,
      archetype: null,
      attack: 0,
      defense: 0,
      abilityName: null,
      abilityEffect: null,
      abilityValue: null,
      abilityTrigger: null,
      flavorText,
      imageUrl: params.imageUrl,
    };
  }

  const stats = computeDefaultBattleStats(rarity, archetype);
  return {
    eraId: params.eraId,
    name: params.name,
    seed: params.seed,
    cardType: params.cardType,
    rarity,
    cost,
    archetype,
    attack: stats.attack,
    defense: stats.defense,
    abilityName: stats.abilityName,
    abilityEffect: stats.abilityEffect,
    abilityValue: stats.abilityValue,
    flavorText,
    imageUrl: params.imageUrl,
  };
}

type DiscoveredCard = {
  name: string;
  cardType: (typeof CARD_TYPE_ENUM)[number];
  sourcePath: string;
  /** Era subfolder under the card-type folder, e.g. Characters/tudor-england/Anne Boleyn.png */
  eraFolderHint?: string;
};

function appendDiscoveredImage(params: {
  discovered: DiscoveredCard[];
  cardType: (typeof CARD_TYPE_ENUM)[number];
  sourcePath: string;
  eraFolderHint?: string;
}) {
  const ext = path.extname(params.sourcePath).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(ext)) return;
  params.discovered.push({
    name: cardNameFromFilename(path.basename(params.sourcePath)),
    cardType: params.cardType,
    sourcePath: params.sourcePath,
    eraFolderHint: params.eraFolderHint,
  });
}

function scanCardTypeDir(
  typeDir: string,
  cardType: (typeof CARD_TYPE_ENUM)[number],
  discovered: DiscoveredCard[],
) {
  for (const entry of fs.readdirSync(typeDir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;

    const entryPath = path.join(typeDir, entry.name);
    if (entry.isFile()) {
      appendDiscoveredImage({ discovered, cardType, sourcePath: entryPath });
      continue;
    }

    if (!entry.isDirectory()) continue;

    for (const file of fs.readdirSync(entryPath)) {
      if (file.startsWith(".")) continue;
      const sourcePath = path.join(entryPath, file);
      if (!fs.statSync(sourcePath).isFile()) continue;
      appendDiscoveredImage({
        discovered,
        cardType,
        sourcePath,
        eraFolderHint: entry.name,
      });
    }
  }
}

function sortDiscoveredCards(discovered: DiscoveredCard[]) {
  discovered.sort((a, b) => {
    const typeDelta =
      CARD_TYPE_IMPORT_ORDER.indexOf(a.cardType) - CARD_TYPE_IMPORT_ORDER.indexOf(b.cardType);
    if (typeDelta !== 0) return typeDelta;
    return a.name.localeCompare(b.name);
  });
}

/** Scan a book folder or a single card-type folder (e.g. Events/) for importable art. */
export function discoverCardsInImportDir(dir: string) {
  const absDir = path.resolve(dir);
  if (!fs.existsSync(absDir) || !fs.statSync(absDir).isDirectory()) {
    throw new Error(`Import directory not found: ${absDir}`);
  }

  const discovered: DiscoveredCard[] = [];
  const directCardType = parseCardTypeFolder(path.basename(absDir));

  if (directCardType) {
    scanCardTypeDir(absDir, directCardType, discovered);
    sortDiscoveredCards(discovered);
    return { absDir, discovered };
  }

  for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;

    const cardType = parseCardTypeFolder(entry.name);
    if (!cardType) {
      console.warn(`Skipping unknown folder "${entry.name}" (expected Characters, Units, Locations, or Events).`);
      continue;
    }

    scanCardTypeDir(path.join(absDir, entry.name), cardType, discovered);
  }

  sortDiscoveredCards(discovered);
  return { absDir, discovered };
}

function discoverCards(dir: string) {
  return discoverCardsInImportDir(dir);
}

async function lookupEraBySlug(slug: string) {
  const [row] = await db.select().from(eras).where(eq(eras.slug, slug));
  return row ?? null;
}

function matchEraHint(
  hint: string,
  eraBySlug: Map<string, typeof eras.$inferSelect>,
  allEras: typeof eras.$inferSelect[],
) {
  const trimmed = hint.trim();
  const lower = trimmed.toLowerCase();
  const slugMatch = eraBySlug.get(lower) ?? eraBySlug.get(slugify(trimmed));
  if (slugMatch) return slugMatch;

  return allEras.find((era) => era.name.toLowerCase() === lower) ?? null;
}

async function lookupEraByExistingCharacter(
  name: string,
  cardType: (typeof CARD_TYPE_ENUM)[number],
) {
  const rows = await db
    .select({ era: eras })
    .from(characters)
    .innerJoin(eras, eq(characters.eraId, eras.id))
    .where(
      and(
        eq(characters.cardType, cardType),
        sql`lower(${characters.name}) = lower(${name})`,
      ),
    );

  if (rows.length !== 1) return null;
  return rows[0]!.era;
}

function resolveCardEraFromHints(params: {
  cardName: string;
  override: CardImportOverride;
  defaults: CardImportOverride;
  eraFolderHint?: string;
  context: Pick<ImportContext, "defaultEra" | "multiEra" | "eraBySlug">;
  allEras: typeof eras.$inferSelect[];
}) {
  const { cardName, override, defaults, eraFolderHint, context, allEras } = params;

  const slug =
    override.eraSlug ??
    (eraFolderHint ? matchEraHint(eraFolderHint, context.eraBySlug, allEras)?.slug : undefined) ??
    (context.multiEra ? defaults.eraSlug : undefined);

  if (slug) {
    const era = context.eraBySlug.get(slug);
    if (!era) {
      throw new ApiError(400, `Unknown era "${slug}" for card "${cardName}".`);
    }
    return era;
  }
  if (context.defaultEra) return context.defaultEra;
  return null;
}

async function resolveImportTarget(options: ImportCatalogBookCardsOptions) {
  const absDir = path.resolve(options.dir);
  const title = options.bookTitle?.trim() || path.basename(absDir);
  let book: Awaited<ReturnType<typeof getCatalogBook>> | null = null;

  if (options.bookId != null) {
    book = await getCatalogBook(options.bookId);

    if (options.multiEra) {
      let defaultEra: typeof eras.$inferSelect | null = null;
      if (book.eraId != null) {
        const [bookEra] = await db.select().from(eras).where(eq(eras.id, book.eraId));
        if (!bookEra) throw new ApiError(400, "The target book's era could not be found.");
        defaultEra = bookEra;
      } else if (options.eraSlug) {
        defaultEra = await lookupEraBySlug(options.eraSlug);
        if (!defaultEra) throw new ApiError(400, `Era not found: ${options.eraSlug}`);
      }

      return { absDir, book, defaultEra, multiEra: true as const, title };
    }
  } else {
    let eraForLookup: typeof eras.$inferSelect | undefined;
    if (options.eraSlug) {
      [eraForLookup] = await db.select().from(eras).where(eq(eras.slug, options.eraSlug));
    }

    if (eraForLookup) {
      const [existing] = await db
        .select()
        .from(catalogBooks)
        .where(and(eq(catalogBooks.title, title), eq(catalogBooks.eraId, eraForLookup.id)));
      if (existing) book = { ...existing, eraName: null };
    }

    if (!book) {
      const matches = await db.select().from(catalogBooks).where(eq(catalogBooks.title, title));
      if (matches.length === 1) {
        const [only] = matches;
        book = { ...only!, eraName: null };
      } else if (matches.length > 1 && !options.eraSlug) {
        throw new ApiError(
          400,
          `Multiple catalog books named "${title}" — pass --book-id or --era-slug to choose one.`,
        );
      }
    }
  }

  let defaultEra: typeof eras.$inferSelect | null;
  if (book?.eraId != null) {
    const [bookEra] = await db.select().from(eras).where(eq(eras.id, book.eraId));
    if (!bookEra) throw new ApiError(400, "The target book's era could not be found.");
    defaultEra = bookEra;
  } else if (options.eraSlug) {
    defaultEra = await lookupEraBySlug(options.eraSlug);
    if (!defaultEra) throw new ApiError(400, `Era not found: ${options.eraSlug}`);
  } else {
    throw new ApiError(
      400,
      "Choose an era, or import into a catalog book that already has an era assigned.",
    );
  }

  if (!book) {
    if (!options.createBook) {
      throw new ApiError(
        400,
        `Catalog book "${title}" not found. Re-run with --create-book, --book-id, or assign an era.`,
      );
    }

    if (options.dryRun || options.scanOnly) {
      book = {
        id: -1,
        title,
        author: null,
        isbn: null,
        openLibraryId: null,
        coverUrl: null,
        summary: null,
        totalPages: 1,
        wordCount: null,
        wordsPerPage: null,
        eraId: defaultEra.id,
        timelineYear: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        eraName: null,
      };
    } else {
      book = await createCatalogBook({
        title,
        eraId: defaultEra.id,
        totalPages: 1,
        active: true,
      });
    }
  }

  return { absDir, book, defaultEra, multiEra: false as const, title };
}

async function ensureCharacterEra(characterId: number, eraId: number) {
  await db
    .update(characters)
    .set({ eraId })
    .where(and(eq(characters.id, characterId), ne(characters.eraId, eraId)));
}

function duplicateDecisionFor(
  seed: string,
  options: ImportCatalogBookCardsOptions,
): ImportDuplicateDecision | undefined {
  return options.duplicateDecisions?.[seed] ?? options.duplicatePolicy;
}

async function findExistingCharacterForImport(params: {
  eraId: number;
  name: string;
  cardType: (typeof CARD_TYPE_ENUM)[number];
  seed: string;
}) {
  const [bySeed] = await db.select().from(characters).where(eq(characters.seed, params.seed));
  if (bySeed) return { character: bySeed, matchedBy: "seed" as const };

  const [byName] = await db
    .select()
    .from(characters)
    .where(
      and(
        eq(characters.eraId, params.eraId),
        eq(characters.cardType, params.cardType),
        sql`lower(${characters.name}) = lower(${params.name})`,
      ),
    );

  if (byName) return { character: byName, matchedBy: "name" as const };
  return null;
}

function resultEraSlug(context: ImportContext) {
  if (context.multiEra) {
    const slugs = [...new Set(context.previews.map((preview) => preview.eraSlug))];
    return slugs.length === 1 ? slugs[0]! : "multi-era";
  }
  return context.defaultEra?.slug ?? "unknown";
}

function emptyResult(context: ImportContext): ImportCatalogBookCardsResult {
  return {
    bookId: context.book.id,
    bookTitle: context.book.title,
    eraSlug: resultEraSlug(context),
    imported: 0,
    created: 0,
    updated: 0,
    linked: 0,
    skipped: 0,
    cards: [],
  };
}

async function buildImportContext(options: ImportCatalogBookCardsOptions): Promise<ImportContext> {
  const { absDir, discovered } = discoverCards(options.dir);
  const { defaults, byName } = loadMetadataFile(absDir);
  const { book, defaultEra, multiEra } = await resolveImportTarget(options);
  const allEras = await db.select().from(eras);
  const eraBySlug = new Map(allEras.map((era) => [era.slug, era]));

  const bookSlug = slugify(book.title) || slugifyCardName(book.title) || "book";
  const defaultRarity = options.defaultRarity ?? defaults.rarity ?? "common";
  const previews: ImportCardPreview[] = [];
  const eraContext = { defaultEra, multiEra, eraBySlug };
  const missingEra: string[] = [];

  for (const card of discovered) {
    const override = { ...defaults, ...byName.get(card.name) };
    const cardType = override.cardType ?? card.cardType;
    const seed = cardSeed(bookSlug, cardType, card.name);

    let cardEra =
      resolveCardEraFromHints({
        cardName: card.name,
        override,
        defaults,
        eraFolderHint: card.eraFolderHint,
        context: eraContext,
        allEras,
      }) ?? (await lookupEraByExistingCharacter(card.name, cardType));

    if (!cardEra) {
      if (multiEra) {
        missingEra.push(card.name);
        continue;
      }
      throw new ApiError(400, "Could not resolve era for import.");
    }

    const match = await findExistingCharacterForImport({
      eraId: cardEra.id,
      name: card.name,
      cardType,
      seed,
    });

    previews.push({
      key: seed,
      name: card.name,
      cardType,
      seed,
      sourcePath: card.sourcePath,
      status: match ? "existing" : "new",
      eraId: cardEra.id,
      eraSlug: cardEra.slug,
      existingCharacterId: match?.character.id,
      existingImageUrl: match?.character.imageUrl ?? null,
      matchedBy: match?.matchedBy,
    });
  }

  if (missingEra.length > 0) {
    const sample = missingEra.slice(0, 8).join(", ");
    const remainder = missingEra.length > 8 ? ` and ${missingEra.length - 8} more` : "";
    throw new ApiError(
      400,
      `${missingEra.length} card${missingEra.length === 1 ? "" : "s"} still need an era (${sample}${remainder}). Sort into era subfolders (e.g. Characters/tudor-england/Anne Boleyn.png), add eraSlug in cards.json, match an existing codex card by name, or pick a default era in the form.`,
    );
  }

  return {
    absDir,
    defaultEra,
    multiEra,
    book,
    bookSlug,
    defaultRarity,
    defaults,
    byName,
    eraBySlug,
    previews,
  };
}

export async function scanCatalogBookCardsImport(
  options: ImportCatalogBookCardsOptions,
): Promise<ImportCatalogBookCardsResult> {
  const context = await buildImportContext({ ...options, scanOnly: true });
  const duplicates = context.previews.filter((card) => card.status === "existing");
  const newCards = context.previews.filter((card) => card.status === "new");

  return {
    ...emptyResult(context),
    needsConfirmation: duplicates.length > 0,
    duplicates,
    newCards,
    imported: context.previews.length,
    created: newCards.length,
    updated: duplicates.length,
    linked: context.previews.length,
  };
}

export async function importCatalogBookCardsFromDir(
  options: ImportCatalogBookCardsOptions,
): Promise<ImportCatalogBookCardsResult> {
  const context = await buildImportContext(options);
  const duplicates = context.previews.filter((card) => card.status === "existing");
  const newCards = context.previews.filter((card) => card.status === "new");
  const result = emptyResult(context);

  if (options.scanOnly) {
    return {
      ...result,
      needsConfirmation: duplicates.length > 0,
      duplicates,
      newCards,
      imported: context.previews.length,
      created: newCards.length,
      updated: duplicates.length,
      linked: context.previews.length,
    };
  }

  if (options.dryRun) {
    for (const preview of context.previews) {
      if (preview.status === "existing") {
        const decision = duplicateDecisionFor(preview.seed, options);
        if (decision === "ignore") {
          result.skipped++;
          result.cards.push({
            name: preview.name,
            cardType: preview.cardType,
            seed: preview.seed,
            action: "linked_existing",
          });
        } else {
          result.updated++;
          result.cards.push({
            name: preview.name,
            cardType: preview.cardType,
            seed: preview.seed,
            action: "updated",
          });
        }
      } else {
        result.created++;
        result.cards.push({
          name: preview.name,
          cardType: preview.cardType,
          seed: preview.seed,
          action: "created",
        });
      }
      result.imported++;
    }
    result.linked = result.imported;
    result.needsConfirmation =
      duplicates.length > 0 &&
      duplicates.some((preview) => !duplicateDecisionFor(preview.seed, options));
    result.duplicates = duplicates;
    result.newCards = newCards;
    return result;
  }

  const unresolvedDuplicates = duplicates.filter(
    (preview) => !duplicateDecisionFor(preview.seed, options),
  );
  if (unresolvedDuplicates.length > 0) {
    return {
      ...result,
      needsConfirmation: true,
      duplicates,
      newCards,
    };
  }

  let book = context.book;
  if (book.id === -1) {
    if (!context.defaultEra) {
      throw new ApiError(400, "Choose an era before creating a new catalog book.");
    }
    book = await createCatalogBook({
      title: book.title,
      eraId: context.defaultEra.id,
      totalPages: 1,
      active: true,
    });
  } else if (book.eraId == null && context.defaultEra && !context.multiEra) {
    await db
      .update(catalogBooks)
      .set({ eraId: context.defaultEra.id, updatedAt: new Date() })
      .where(eq(catalogBooks.id, book.id));
    book = { ...book, eraId: context.defaultEra.id };
  }

  const importedCharacterIds: number[] = [];

  for (const preview of context.previews) {
    const override = { ...context.defaults, ...context.byName.get(preview.name) };
    const cardType = override.cardType ?? preview.cardType;
    const seed = preview.seed;
    const cardEraId = preview.eraId;

    if (preview.status === "existing" && preview.existingCharacterId != null) {
      const decision = duplicateDecisionFor(seed, options)!;
      if (decision === "ignore") {
        await ensureCharacterEra(preview.existingCharacterId, cardEraId);
        importedCharacterIds.push(preview.existingCharacterId);
        result.skipped++;
        result.cards.push({
          name: preview.name,
          cardType,
          seed,
          action: "linked_existing",
        });
        continue;
      }

      const imageUrl = await importImageFile(preview.sourcePath);
      const values = buildCharacterValues({
        eraId: cardEraId,
        name: preview.name,
        seed,
        cardType,
        override,
        defaultRarity: context.defaultRarity,
        imageUrl,
      });
      const [updated] = await db
        .update(characters)
        .set(values)
        .where(eq(characters.id, preview.existingCharacterId))
        .returning();

      importedCharacterIds.push(updated!.id);
      result.updated++;
      result.cards.push({ name: preview.name, cardType, seed, action: "updated" });
      result.imported++;
      continue;
    }

    const imageUrl = await importImageFile(preview.sourcePath);
    const values = buildCharacterValues({
      eraId: cardEraId,
      name: preview.name,
      seed,
      cardType,
      override,
      defaultRarity: context.defaultRarity,
      imageUrl,
    });
    const [created] = await db.insert(characters).values(values).returning();
    importedCharacterIds.push(created!.id);
    result.created++;
    result.cards.push({ name: preview.name, cardType, seed, action: "created" });
    result.imported++;
  }

  if (options.mergeLinks && book.id > 0) {
    const existingLinks = await listCatalogBookCards(book.id);
    const existingIds = new Set(existingLinks.map((row) => row.characterId));
    for (const characterId of importedCharacterIds) {
      if (existingIds.has(characterId)) continue;
      await addCatalogBookCard(book.id, characterId);
      result.linked++;
    }
  } else if (book.id > 0) {
    await setCatalogBookCards(book.id, importedCharacterIds);
    result.linked = importedCharacterIds.length;
  }

  result.bookId = book.id;
  result.eraSlug = resultEraSlug(context);
  return result;
}

export function describeImportFolderLayout() {
  return `Book folder/
  Characters/
    Anne Boleyn.png
    tudor-england/
      Elizabeth I.png
  Units/
    roman-empire/
      Roman legions.png
  Locations/
  Events/
    Battle of Hastings.png
    tudor-england/
      Field of the Cloth of Gold.png
  cards.json   (optional — rarity, flavorText, eraSlug per card)

You can also select a single card-type folder (e.g. Events/) if you are importing just those cards.`;
}
