import { randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ApiError } from "@/lib/api-utils";

const STAGING_ROOT = path.join(os.tmpdir(), "historycodex-imports");

type StagedFile = {
  relativePath: string;
  buffer: Buffer;
};

function sanitizeRelativePath(relativePath: string): string {
  const normalized = path.normalize(relativePath.replace(/\\/g, "/"));
  if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
    throw new ApiError(400, `Invalid file path: ${relativePath}`);
  }
  return normalized;
}

function resolveStagingDir(sessionId?: string | null) {
  const id = sessionId?.trim() || randomUUID();
  if (!/^[a-f0-9-]{36}$/i.test(id)) {
    throw new ApiError(400, "Invalid staging session.");
  }

  const dir = path.join(STAGING_ROOT, id);
  return { sessionId: id, dir };
}

export function inferImportFolderName(relativePaths: string[], fallback = "import"): string {
  const firstSegments = relativePaths
    .map((entry) => sanitizeRelativePath(entry).split(path.sep)[0])
    .filter(Boolean);

  if (firstSegments.length === 0) return fallback;

  const uniqueRoots = new Set(firstSegments);
  if (uniqueRoots.size === 1) {
    return firstSegments[0]!;
  }

  return fallback;
}

export async function stageImportFolderFiles(params: {
  sessionId?: string | null;
  files: StagedFile[];
}): Promise<{ sessionId: string; dir: string; fileCount: number; folderName: string }> {
  if (params.files.length === 0) {
    throw new ApiError(400, "No files were provided.");
  }

  const { sessionId, dir } = resolveStagingDir(params.sessionId);
  fs.mkdirSync(dir, { recursive: true });

  for (const file of params.files) {
    const relativePath = sanitizeRelativePath(file.relativePath);
    const targetPath = path.join(dir, relativePath);
    const parentDir = path.dirname(targetPath);
    if (!parentDir.startsWith(dir)) {
      throw new ApiError(400, `Invalid file path: ${file.relativePath}`);
    }
    fs.mkdirSync(parentDir, { recursive: true });
    fs.writeFileSync(targetPath, file.buffer);
  }

  const fileCount = fs
    .readdirSync(dir, { recursive: true })
    .filter((entry) => {
      const fullPath = path.join(dir, String(entry));
      return fs.existsSync(fullPath) && fs.statSync(fullPath).isFile();
    }).length;

  const relativePaths = params.files.map((file) => file.relativePath);
  const folderName = inferImportFolderName(relativePaths);

  return {
    sessionId,
    dir,
    fileCount,
    folderName,
  };
}
