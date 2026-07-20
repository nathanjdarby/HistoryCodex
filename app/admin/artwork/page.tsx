"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageDown, Trash2 } from "lucide-react";

type ArtworkFile = {
  filename: string;
  url: string;
  sizeBytes: number;
  modifiedAt: string;
  usedBy: { id: number; name: string }[];
  isWebp: boolean;
};
type ArtworkResponse = {
  files: ArtworkFile[];
  totalBytes: number;
  unusedCount: number;
  nonWebpCount: number;
};

async function fetchArtwork(): Promise<ArtworkResponse> {
  const res = await fetch("/api/admin/artwork");
  if (!res.ok) throw new Error("Failed to load artwork");
  return res.json();
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminArtworkPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-artwork"], queryFn: fetchArtwork });

  const invalidateArtwork = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-artwork"] });
    queryClient.invalidateQueries({ queryKey: ["characters"] });
  };

  const deleteMutation = useMutation({
    mutationFn: async ({ filename, force }: { filename: string; force: boolean }) => {
      const url = `/api/admin/artwork/${encodeURIComponent(filename)}${force ? "?force=true" : ""}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to delete file");
      }
      return res.json();
    },
    onSuccess: invalidateArtwork,
    onError: (err: Error) => alert(err.message),
  });

  const convertOneMutation = useMutation({
    mutationFn: async (filename: string) => {
      const res = await fetch(
        `/api/admin/artwork/${encodeURIComponent(filename)}/convert-webp`,
        { method: "POST" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to convert file");
      }
      return res.json();
    },
    onSuccess: invalidateArtwork,
    onError: (err: Error) => alert(err.message),
  });

  const convertAllMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/artwork/convert-webp", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to convert artwork");
      }
      return res.json() as Promise<{
        converted: { oldFilename: string; newFilename: string; oldSizeBytes: number; newSizeBytes: number }[];
        errors: { filename: string; error: string }[];
        savedBytes: number;
      }>;
    },
    onSuccess: (result) => {
      invalidateArtwork();
      const count = result.converted.length;
      if (count === 0 && result.errors.length === 0) {
        alert("All artwork is already WebP.");
        return;
      }
      let message = `Converted ${count} file${count === 1 ? "" : "s"}. Saved ${formatBytes(result.savedBytes)}.`;
      if (result.errors.length > 0) {
        message += `\n\n${result.errors.length} failed:\n${result.errors.map((e) => `${e.filename}: ${e.error}`).join("\n")}`;
      }
      alert(message);
    },
    onError: (err: Error) => alert(err.message),
  });

  function handleDelete(file: ArtworkFile) {
    if (file.usedBy.length === 0) {
      if (confirm(`Delete "${file.filename}"? This cannot be undone.`)) {
        deleteMutation.mutate({ filename: file.filename, force: false });
      }
      return;
    }
    const names = file.usedBy.map((c) => c.name).join(", ");
    const plural = file.usedBy.length > 1 ? "these characters" : "this character";
    if (
      confirm(
        `"${file.filename}" is currently used by: ${names}.\n\nDeleting it will revert ${plural} to their generated pixel sprite. Delete anyway?`,
      )
    ) {
      deleteMutation.mutate({ filename: file.filename, force: true });
    }
  }

  function handleConvertAll() {
    const count = data?.nonWebpCount ?? 0;
    if (count === 0) return;
    if (
      confirm(
        `Convert ${count} non-WebP file${count === 1 ? "" : "s"} to WebP?\n\nCharacter references will be updated and the original files will be deleted.`,
      )
    ) {
      convertAllMutation.mutate();
    }
  }

  const isBusy =
    deleteMutation.isPending || convertOneMutation.isPending || convertAllMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Artwork</h1>
          <p className="text-sm text-muted">
            {data ? (
              <>
                {data.files.length} file{data.files.length === 1 ? "" : "s"} ·{" "}
                {formatBytes(data.totalBytes)} · {data.unusedCount} unused
                {data.nonWebpCount > 0 && (
                  <> · {data.nonWebpCount} not WebP</>
                )}
              </>
            ) : (
              "Loading..."
            )}
          </p>
          <p className="mt-1 text-xs text-subtle">
            New uploads are saved as WebP automatically. Convert existing files below to save disk
            space.
          </p>
        </div>
        {data && data.nonWebpCount > 0 && (
          <button
            type="button"
            onClick={handleConvertAll}
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground hover:bg-surface/80 disabled:opacity-50"
          >
            <ImageDown size={15} />
            Convert all to WebP ({data.nonWebpCount})
          </button>
        )}
      </div>

      {isLoading && <p className="text-sm text-muted">Loading...</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {data?.files.map((file) => (
          <div
            key={file.filename}
            className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface/40"
          >
            <div className="relative aspect-square w-full bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={file.url} alt="" className="h-full w-full object-cover" />
              <div className="absolute right-1.5 top-1.5 hidden gap-1 group-hover:flex">
                {!file.isWebp && (
                  <button
                    type="button"
                    onClick={() => convertOneMutation.mutate(file.filename)}
                    disabled={isBusy}
                    className="rounded bg-background/80 p-1.5 text-foreground/80 hover:text-emerald-400 disabled:opacity-50"
                    aria-label={`Convert ${file.filename} to WebP`}
                    title="Convert to WebP"
                  >
                    <ImageDown size={13} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(file)}
                  disabled={isBusy}
                  className="rounded bg-background/80 p-1.5 text-foreground/80 hover:text-red-400 disabled:opacity-50"
                  aria-label={`Delete ${file.filename}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
              {!file.isWebp && (
                <span className="absolute bottom-1.5 left-1.5 rounded bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-medium uppercase text-black">
                  {file.filename.split(".").pop()}
                </span>
              )}
            </div>
            <div className="p-2">
              <p className="truncate text-xs text-muted" title={file.filename}>
                {file.filename}
              </p>
              <p className="mt-0.5 text-[10px] text-subtle">
                {formatBytes(file.sizeBytes)} · {new Date(file.modifiedAt).toLocaleDateString()}
              </p>
              {file.usedBy.length > 0 ? (
                <p
                  className="mt-1 truncate text-[10px] text-emerald-400"
                  title={file.usedBy.map((c) => c.name).join(", ")}
                >
                  {file.usedBy.map((c) => c.name).join(", ")}
                </p>
              ) : (
                <p className="mt-1 text-[10px] text-subtle">Unused</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {data?.files.length === 0 && !isLoading && (
        <p className="text-sm text-muted">
          No uploaded artwork yet — custom images uploaded from the character form will show up
          here.
        </p>
      )}
    </div>
  );
}
