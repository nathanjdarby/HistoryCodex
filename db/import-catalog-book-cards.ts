import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import path from "node:path";
import {
  describeImportFolderLayout,
  importCatalogBookCardsFromDir,
  type ImportCatalogBookCardsOptions,
  type ImportDuplicateDecision,
  type ImportCardPreview,
} from "@/lib/server/import-catalog-book-cards";
import type { Rarity } from "@/lib/sprite/generateSprite";

function printHelp() {
  console.log(`Import catalog book cards from a folder of card art.

Expected layout:
${describeImportFolderLayout()}

Usage:
  npm run db:import-book-cards -- --dir ./imports/the-anglo-saxons --era-slug anglo-saxon-england

Options:
  --dir              Path to the book folder (required)
  --era-slug         Era slug for cards (optional when --book-id targets a book with an era)
  --book-title       Catalog book title (default: folder name)
  --book-id          Import into this catalog book and use its era when set
  --create-book      Create the catalog book if it does not exist
  --default-rarity   Default rarity when cards.json has no override (default: common)
  --merge-links      Add imported cards without removing existing book links
  --dry-run          Scan and report without writing files or DB rows
  --on-duplicate     Existing cards: ask, replace art, add book variant, or ignore (default: ask)
  --help             Show this help text
`);
}

function parseArgs(argv: string[]): ImportCatalogBookCardsOptions & { onDuplicate: "ask" | ImportDuplicateDecision } {
  const options: ImportCatalogBookCardsOptions & { onDuplicate: "ask" | ImportDuplicateDecision } = {
    dir: "",
    eraSlug: "",
    onDuplicate: "ask",
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;
      case "--dir":
        options.dir = argv[++i] ?? "";
        break;
      case "--era-slug":
        options.eraSlug = argv[++i] ?? "";
        break;
      case "--book-title":
        options.bookTitle = argv[++i] ?? "";
        break;
      case "--book-id":
        options.bookId = Number(argv[++i]);
        break;
      case "--default-rarity":
        options.defaultRarity = argv[++i] as Rarity;
        break;
      case "--create-book":
        options.createBook = true;
        break;
      case "--merge-links":
        options.mergeLinks = true;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--on-duplicate":
        options.onDuplicate = (argv[++i] ?? "ask") as "ask" | ImportDuplicateDecision;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!options.dir) {
    printHelp();
    throw new Error("--dir is required.");
  }

  if (!options.eraSlug && options.bookId == null) {
    printHelp();
    throw new Error("Provide --book-id or --era-slug.");
  }

  options.dir = path.resolve(options.dir);
  if (
    options.onDuplicate === "replace" ||
    options.onDuplicate === "ignore" ||
    options.onDuplicate === "add_variant"
  ) {
    options.duplicatePolicy = options.onDuplicate;
  }
  return options;
}

async function promptDuplicateDecision(card: ImportCardPreview): Promise<ImportDuplicateDecision> {
  const rl = createInterface({ input, output });
  try {
    while (true) {
      const answer = (
        await rl.question(
          `"${card.name}" (${card.cardType}) already exists on the platform. Replace art, add as a book variant, or ignore file and link existing card? [replace/variant/ignore]: `,
        )
      )
        .trim()
        .toLowerCase();

      if (answer === "replace" || answer === "r") return "replace";
      if (answer === "variant" || answer === "v" || answer === "add_variant") return "add_variant";
      if (answer === "ignore" || answer === "i") return "ignore";
      console.log("Please enter replace, variant, or ignore.");
    }
  } finally {
    rl.close();
  }
}

async function resolveDuplicateDecisions(
  options: ImportCatalogBookCardsOptions & { onDuplicate: "ask" | ImportDuplicateDecision },
) {
  let result = await importCatalogBookCardsFromDir(options);

  while (result.needsConfirmation && result.duplicates?.length) {
    if (options.onDuplicate !== "ask") {
      throw new Error("Duplicate cards found but no duplicate policy was applied.");
    }

    const duplicateDecisions = { ...options.duplicateDecisions };
    for (const duplicate of result.duplicates) {
      duplicateDecisions[duplicate.seed] = await promptDuplicateDecision(duplicate);
    }

    options = {
      ...options,
      duplicateDecisions,
    };
    result = await importCatalogBookCardsFromDir(options);
  }

  return result;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = options.dryRun
    ? await importCatalogBookCardsFromDir(options)
    : await resolveDuplicateDecisions(options);

  if (result.needsConfirmation && options.dryRun) {
    console.log(
      `${result.duplicates?.length ?? 0} existing cards would require replace/ignore decisions.`,
    );
  }

  console.log(
    `${options.dryRun ? "[dry-run] " : ""}Imported ${result.imported} cards for "${result.bookTitle}" (book #${result.bookId}).`,
  );
  console.log(
    `Created ${result.created}, updated ${result.updated}, linked ${result.linked}, skipped ${result.skipped}.`,
  );

  for (const card of result.cards) {
    const prefix =
      card.action === "created"
        ? "+"
        : card.action === "updated"
          ? "~"
          : card.action === "linked_existing"
            ? "="
            : "-";
    console.log(`  ${prefix} ${card.cardType}: ${card.name} (${card.seed})`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
