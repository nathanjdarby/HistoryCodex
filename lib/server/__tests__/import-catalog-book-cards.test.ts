import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { discoverCardsInImportDir } from "@/lib/server/import-catalog-book-cards";
import { importStagingPreviewUrl } from "@/lib/server/stage-import-folder";

const tempDirs: string[] = [];

function makeTempDir(name: string) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `hc-import-${name}-`));
  tempDirs.push(dir);
  return dir;
}

function touchImage(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, "fake");
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("discoverCardsInImportDir", () => {
  it("finds event cards in a book Events subfolder", () => {
    const bookDir = makeTempDir("book");
    touchImage(path.join(bookDir, "Events", "Battle of Hastings.png"));
    touchImage(path.join(bookDir, "Characters", "William.png"));

    const { discovered } = discoverCardsInImportDir(bookDir);

    assert.deepEqual(
      discovered.map((card) => [card.name, card.cardType]),
      [
        ["William", "character"],
        ["Battle of Hastings", "event"],
      ],
    );
  });

  it("finds event cards when the Events folder itself is selected", () => {
    const eventsDir = path.join(makeTempDir("events"), "Events");
    touchImage(path.join(eventsDir, "Battle of Hastings.png"));
    touchImage(path.join(eventsDir, "anglo-saxon", "Plague.png"));

    const { discovered } = discoverCardsInImportDir(eventsDir);

    assert.deepEqual(
      discovered.map((card) => [card.name, card.cardType]),
      [
        ["Battle of Hastings", "event"],
        ["Plague", "event"],
      ],
    );
  });

  it("builds a preview URL for staged import files", () => {
    const sessionId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    const stagingRoot = path.join(os.tmpdir(), "historycodex-imports");
    const stagedDir = path.join(stagingRoot, sessionId);
    fs.mkdirSync(stagedDir, { recursive: true });
    tempDirs.push(stagedDir);

    const imagePath = path.join(stagedDir, "Characters", "William.png");
    touchImage(imagePath);

    const previewUrl = importStagingPreviewUrl(stagedDir, imagePath);
    assert.equal(
      previewUrl,
      "/api/admin/catalog-books/import/preview?session=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee&path=Characters%2FWilliam.png",
    );
  });
});
