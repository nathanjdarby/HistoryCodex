type PickedImportFile = {
  relativePath: string;
  file: File;
};

type DirectoryHandleWithEntries = FileSystemDirectoryHandle & {
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
};

const MAX_UPLOAD_BATCH_BYTES = 8 * 1024 * 1024;

const CARD_TYPE_FOLDER_NAMES = new Set([
  "character",
  "characters",
  "unit",
  "units",
  "location",
  "locations",
  "event",
  "events",
]);

function normalizeImportRelativePaths(files: PickedImportFile[]): {
  files: PickedImportFile[];
  folderName: string | null;
} {
  if (files.length === 0) return { files, folderName: null };

  const splitPaths = files.map((entry) => entry.relativePath.split("/").filter(Boolean));
  const rootNames = splitPaths.map((segments) => segments[0]).filter(Boolean);
  const uniqueRoots = new Set(rootNames);
  if (uniqueRoots.size !== 1) {
    return { files, folderName: rootNames[0] ?? null };
  }

  const rootName = rootNames[0]!;
  const wrapsCardFolders = splitPaths.every(
    (segments) =>
      segments.length >= 2 && CARD_TYPE_FOLDER_NAMES.has(segments[1]!.toLowerCase()),
  );

  if (!wrapsCardFolders) {
    return { files, folderName: rootName };
  }

  return {
    folderName: rootName,
    files: files.map((entry) => ({
      ...entry,
      relativePath: entry.relativePath.split("/").slice(1).join("/"),
    })),
  };
}

async function collectFilesFromDirectoryHandle(
  handle: FileSystemDirectoryHandle,
  basePath = "",
): Promise<PickedImportFile[]> {
  const files: PickedImportFile[] = [];

  for await (const [name, entry] of (handle as DirectoryHandleWithEntries).entries()) {
    const relativePath = basePath ? `${basePath}/${name}` : name;
    if (entry.kind === "file") {
      files.push({ relativePath, file: await (entry as FileSystemFileHandle).getFile() });
      continue;
    }
    files.push(
      ...(await collectFilesFromDirectoryHandle(entry as FileSystemDirectoryHandle, relativePath)),
    );
  }

  return files;
}

export async function pickImportFolderWithDirectoryPicker(): Promise<{
  files: PickedImportFile[];
  folderName: string;
} | null> {
  if (typeof window === "undefined" || !("showDirectoryPicker" in window)) {
    return null;
  }

  const handle = await window.showDirectoryPicker();
  const files = await collectFilesFromDirectoryHandle(handle);
  return { files, folderName: handle.name };
}

export function filesFromDirectoryInput(fileList: FileList | null): {
  files: PickedImportFile[];
  folderName: string | null;
} {
  const files: PickedImportFile[] = [];
  let folderName: string | null = null;

  for (const file of fileList ?? []) {
    const relativePath = file.webkitRelativePath || file.name;
    if (!relativePath) continue;

    const [root] = relativePath.split("/");
    if (root && !folderName) folderName = root;

    files.push({ relativePath, file });
  }

  return { files, folderName };
}

function batchImportFilesBySize(files: PickedImportFile[]): PickedImportFile[][] {
  const batches: PickedImportFile[][] = [];
  let currentBatch: PickedImportFile[] = [];
  let currentBatchBytes = 0;

  for (const entry of files) {
    const fileSize = entry.file.size;
    if (
      currentBatch.length > 0 &&
      currentBatchBytes + fileSize > MAX_UPLOAD_BATCH_BYTES
    ) {
      batches.push(currentBatch);
      currentBatch = [];
      currentBatchBytes = 0;
    }

    currentBatch.push(entry);
    currentBatchBytes += fileSize;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

async function uploadImportFolderBatch(params: {
  sessionId?: string;
  files: PickedImportFile[];
}): Promise<{ sessionId: string; dir: string; fileCount: number; folderName: string }> {
  const body = new FormData();
  if (params.sessionId) body.set("sessionId", params.sessionId);

  for (const entry of params.files) {
    body.append("files", entry.file);
    body.append("paths", entry.relativePath);
  }

  const res = await fetch("/api/admin/catalog-books/import/stage", {
    method: "POST",
    body,
  });
  const payload = (await res.json().catch(() => ({}))) as {
    error?: string;
    sessionId?: string;
    dir?: string;
    fileCount?: number;
    folderName?: string;
  };

  if (!res.ok || !payload.dir || !payload.sessionId) {
    throw new Error(
      payload.error ??
        (res.status === 500
          ? "Upload failed. If this keeps happening, restart the dev server and try again."
          : "Failed to upload import folder."),
    );
  }

  return {
    sessionId: payload.sessionId,
    dir: payload.dir,
    fileCount: payload.fileCount ?? params.files.length,
    folderName: payload.folderName ?? "import",
  };
}

export async function uploadImportFolder(
  files: PickedImportFile[],
  onProgress?: (uploaded: number, total: number) => void,
): Promise<{ dir: string; fileCount: number; folderName: string }> {
  const normalized = normalizeImportRelativePaths(files);
  const uploadFiles = normalized.files;

  if (uploadFiles.length === 0) {
    throw new Error("The selected folder has no files.");
  }

  let sessionId: string | undefined;
  let dir = "";
  let fileCount = 0;
  let folderName = normalized.folderName ?? "import";
  let uploaded = 0;
  const batches = batchImportFilesBySize(uploadFiles);

  for (const batch of batches) {
    const result = await uploadImportFolderBatch({ sessionId, files: batch });
    sessionId = result.sessionId;
    dir = result.dir;
    fileCount = result.fileCount;
    if (result.folderName !== "import") folderName = result.folderName;
    uploaded += batch.length;
    onProgress?.(uploaded, uploadFiles.length);
  }

  return { dir, fileCount, folderName };
}
