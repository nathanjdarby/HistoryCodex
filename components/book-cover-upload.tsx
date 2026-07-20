"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, ImageUp } from "lucide-react";

type BookCoverUploadProps = {
  coverUrl: string | null;
  title: string;
  onCoverUrlChange: (url: string | null) => void | Promise<void>;
  previewClassName?: string;
  compact?: boolean;
};

export function BookCoverUpload({
  coverUrl,
  title,
  onCoverUrlChange,
  previewClassName = "h-40 w-28",
  compact = false,
}: BookCoverUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", "books");
      const res = await fetch("/api/uploads", { method: "POST", body });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload failed");
      }
      const { url } = (await res.json()) as { url: string };
      await onCoverUrlChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const isCustomCover = coverUrl?.startsWith("/uploads/books/") ?? false;
  const [coverFailed, setCoverFailed] = useState(false);

  useEffect(() => {
    setCoverFailed(false);
  }, [coverUrl]);

  const showCover = coverUrl && !coverFailed;

  return (
    <div className={compact ? "flex items-start gap-3" : "space-y-2"}>
      <div className={`relative shrink-0 overflow-hidden rounded bg-surface-raised ${previewClassName}`}>
        {showCover ? (
          // Plain img: Open Library URLs redirect to archive.org, which breaks next/image optimization.
          <img
            src={coverUrl}
            alt={title || "Book cover"}
            className="h-full w-full object-cover"
            onError={() => setCoverFailed(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-subtle">
            <BookOpen size={compact ? 36 : 28} />
          </div>
        )}
      </div>

      <div className={compact ? "space-y-2 pt-1" : undefined}>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 rounded-md border border-border-strong px-3 py-1.5 text-sm text-foreground hover:bg-surface-raised disabled:opacity-50"
          >
            <ImageUp size={14} />
            {uploading ? "Uploading…" : coverUrl ? "Replace cover" : "Upload custom cover"}
          </button>
          {isCustomCover && (
            <button
              type="button"
              onClick={() => onCoverUrlChange(null)}
              disabled={uploading}
              className="rounded-md px-2 py-1.5 text-sm text-muted hover:text-foreground/80 disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>
        <p className="text-xs text-muted">
          PNG, JPEG, GIF, or WebP · max 5MB. Use this if the Open Library cover isn&apos;t right.
        </p>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
    </div>
  );
}
