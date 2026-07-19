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
import { slugify } from "@/lib/api-utils";
import { computeDefaultBattleStats, computeDefaultLocationBuff } from "@/lib/battle";
import {
  addCatalogBookCard,
  listCatalogBookCards,
  setCatalogBookCards,
} from "@/lib/server/catalog-book-cards";
import { createCatalogBook, getCatalogBook } from "@/lib/server/catalog-books";
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
};

export type ImportDuplicateDecision = "replace" | "ignore";

export type ImportCardPreview = {
  key: string;
  name: string;
  cardType: (typeof CARD_TYPE_ENUM)[number];
  seed: string;
  sourcePath: string;
  status: "new" | "existing";
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
  era: typeof eras.$inferSelect;
  book: Awaited<ReturnType<typeof getCatalogBook>> | Awaited<ReturnType<typeof createCatalogBook>>;
  bookSlug: string;
  defaultRarity: Rarity;
  defaults: CardImportOverride;
  byName: Map<string, CardImportOverride>;
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

function importImageFile(sourcePath: string) {
  const ext = path.extname(sourcePath).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(ext)) {
    throw new Error(`Unsupported image type: ${sourcePath}`);
  }

  const normalizedExt = ext === ".jpeg" ? ".jpg" : ext;
  const filename = `${randomUUID()}${normalizedExt}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "characters");
  const destination = path.join(uploadDir, filename);
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.copyFileSync(sourcePath, destination);
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
};

function discoverCards(dir: string) {
  const absDir = path.resolve(dir);
  if (!fs.existsSync(absDir) || !fs.statSync(absDir).isDirectory()) {
    throw new Error(`Import directory not found: ${absDir}`);
  }

  const discovered: DiscoveredCard[] = [];

  for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;

    const cardType = parseCardTypeFolder(entry.name);
    if (!cardType) {
      console.warn(`Skipping unknown folder "${entry.name}" (expected Characters, Units, Locations, or Events).`);
      continue;
    }

    const typeDir = path.join(absDir, entry.name);
    for (const file of fs.readdirSync(typeDir)) {
      if (file.startsWith(".")) continue;
      const sourcePath = path.join(typeDir, file);
      if (!fs.statSync(sourcePath).isFile()) continue;
      const ext = path.extname(file).toLowerCase();
      if (!IMAGE_EXTENSIONS.has(ext)) continue;

      discovered.push({
        name: cardNameFromFilename(file),
        cardType,
        sourcePath,
      });
    }
  }

  discovered.sort((a, b) => {
    const typeDelta =
      CARD_TYPE_IMPORT_ORDER.indexOf(a.cardType) - CARD_TYPE_IMPORT_ORDER.indexOf(b.cardType);
    if (typeDelta !== 0) return typeDelta;
    return a.name.localeCompare(b.name);
  });

  return { absDir, discovered };
}

async function resolveImportTarget(options: ImportCatalogBookCardsOptions) {
  const absDir = path.resolve(options.dir);
  const title = options.bookTitle?.trim() || path.basename(absDir);
  let book: Awaited<ReturnType<typeof getCatalogBook>> | null = null;

  if (options.bookId != null) {
    book = await getCatalogBook(options.bookId);
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
        throw new Error(
          `Multiple catalog books named "${title}" — pass --book-id or --era-slug to choose one.`,
        );
      }
    }
  }

  let era: typeof eras.$inferSelect;
  if (book?.eraId != null) {
    const [bookEra] = await db.select().from(eras).where(eq(eras.id, book.eraId));
    if (!bookEra) throw new Error("The target book's era could not be found.");
    era = bookEra;
  } else if (options.eraSlug) {
    const [selectedEra] = await db.select().from(eras).where(eq(eras.slug, options.eraSlug));
    if (!selectedEra) throw new Error(`Era not found: ${options.eraSlug}`);
    era = selectedEra;
  } else {
    throw new Error(
      "Choose an era, or import into a catalog book that already has an era assigned.",
    );
  }

  if (!book) {
    if (!options.createBook) {
      throw new Error(
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
        eraId: era.id,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        eraName: null,
      };
    } else {
      book = await createCatalogBook({
        title,
        eraId: era.id,
        totalPages: 1,
        active: true,
      });
    }
  }

  return { absDir, book, era, title };
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

function emptyResult(
  context: ImportContext,
  eraSlug: string,
): ImportCatalogBookCardsResult {
  return {
    bookId: context.book.id,
    bookTitle: context.book.title,
    eraSlug,
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
  const { book, era } = await resolveImportTarget(options);

  const bookSlug = slugify(book.title) || slugifyCardName(book.title) || "book";
  const defaultRarity = options.defaultRarity ?? defaults.rarity ?? "common";
  const previews: ImportCardPreview[] = [];

  for (const card of discovered) {
    const override = { ...defaults, ...byName.get(card.name) };
    const cardType = override.cardType ?? card.cardType;
    const seed = cardSeed(bookSlug, cardType, card.name);
    const match = await findExistingCharacterForImport({
      eraId: era.id,
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
      existingCharacterId: match?.character.id,
      existingImageUrl: match?.character.imageUrl ?? null,
      matchedBy: match?.matchedBy,
    });
  }

  return {
    absDir,
    era,
    book,
    bookSlug,
    defaultRarity,
    defaults,
    byName,
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
    ...emptyResult(context, context.era.slug),
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
  const result = emptyResult(context, context.era.slug);

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
    book = await createCatalogBook({
      title: book.title,
      eraId: context.era.id,
      totalPages: 1,
      active: true,
    });
  } else if (book.eraId == null) {
    await db
      .update(catalogBooks)
      .set({ eraId: context.era.id, updatedAt: new Date() })
      .where(eq(catalogBooks.id, book.id));
    book = { ...book, eraId: context.era.id };
  }

  const importedCharacterIds: number[] = [];

  for (const preview of context.previews) {
    const override = { ...context.defaults, ...context.byName.get(preview.name) };
    const cardType = override.cardType ?? preview.cardType;
    const seed = preview.seed;

    if (preview.status === "existing" && preview.existingCharacterId != null) {
      const decision = duplicateDecisionFor(seed, options)!;
      if (decision === "ignore") {
        await ensureCharacterEra(preview.existingCharacterId, context.era.id);
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

      const imageUrl = importImageFile(preview.sourcePath);
      const values = buildCharacterValues({
        eraId: context.era.id,
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

    const imageUrl = importImageFile(preview.sourcePath);
    const values = buildCharacterValues({
      eraId: context.era.id,
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
  result.eraSlug = context.era.slug;
  return result;
}

export function describeImportFolderLayout() {
  return `Book folder/
  Characters/
    Alfred the Great.png
  Units/
    Housecarl.png
  Locations/
    Wessex.png
  Events/
    Battle of Hastings.png
  cards.json   (optional metadata overrides)`;
}
