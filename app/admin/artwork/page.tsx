"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";

type ArtworkFile = {
  filename: string;
  url: string;
  sizeBytes: number;
  modifiedAt: string;
  usedBy: { id: number; name: string }[];
};
type ArtworkResponse = { files: ArtworkFile[]; totalBytes: number; unusedCount: number };

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-artwork"] });
      queryClient.invalidateQueries({ queryKey: ["characters"] });
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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-neutral-100">Artwork</h1>
        <p className="text-sm text-neutral-500">
          {data ? (
            <>
              {data.files.length} file{data.files.length === 1 ? "" : "s"} ·{" "}
              {formatBytes(data.totalBytes)} · {data.unusedCount} unused
            </>
          ) : (
            "Loading..."
          )}
        </p>
      </div>

      {isLoading && <p className="text-sm text-neutral-500">Loading...</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {data?.files.map((file) => (
          <div
            key={file.filename}
            className="group relative flex flex-col overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/40"
          >
            <div className="relative aspect-square w-full bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={file.url} alt="" className="h-full w-full object-cover" />
              <button
                onClick={() => handleDelete(file)}
                className="absolute right-1.5 top-1.5 hidden rounded bg-neutral-950/80 p-1.5 text-neutral-300 hover:text-red-400 group-hover:block"
                aria-label={`Delete ${file.filename}`}
              >
                <Trash2 size={13} />
              </button>
            </div>
            <div className="p-2">
              <p className="truncate text-xs text-neutral-400" title={file.filename}>
                {file.filename}
              </p>
              <p className="mt-0.5 text-[10px] text-neutral-600">
                {formatBytes(file.sizeBytes)} · {new Date(file.modifiedAt).toLocaleDateString()}
              </p>
              {file.usedBy.length > 0 ? (
                <p className="mt-1 truncate text-[10px] text-emerald-400" title={file.usedBy.map((c) => c.name).join(", ")}>
                  {file.usedBy.map((c) => c.name).join(", ")}
                </p>
              ) : (
                <p className="mt-1 text-[10px] text-neutral-600">Unused</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {data?.files.length === 0 && !isLoading && (
        <p className="text-sm text-neutral-500">
          No uploaded artwork yet — custom images uploaded from the character form will show up
          here.
        </p>
      )}
    </div>
  );
}
