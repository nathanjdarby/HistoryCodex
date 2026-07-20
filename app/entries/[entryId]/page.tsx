"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Trash2, Pencil, ArrowRight, ArrowLeft, BookOpen } from "lucide-react";
import { EntryDateFields } from "@/components/entry-date-fields";
import {
  emptyEntryDateForm,
  entryDateFormFromEntry,
  entryDateFormToPayload,
  formatEntryDateRange,
} from "@/lib/entry-dates";
import {
  entryHref,
  linkedBooksWithSource,
  type LinkedEntry,
} from "@/lib/entry-links";
import type { Book, TimelineEntry } from "@/lib/types";

type EntryDetail = {
  entry: TimelineEntry;
  outgoing: LinkedEntry[];
  backlinks: LinkedEntry[];
};

const kindLabel: Record<TimelineEntry["kind"], string> = {
  book: "Book",
  event: "Event",
  person: "Person",
  note: "Note",
};

async function fetchEntry(id: string): Promise<EntryDetail> {
  const res = await fetch(`/api/entries/${id}`);
  if (!res.ok) throw new Error("Failed to load entry");
  return res.json();
}

async function fetchAllEntries(): Promise<TimelineEntry[]> {
  const res = await fetch("/api/entries");
  if (!res.ok) throw new Error("Failed to load entries");
  return res.json();
}

async function fetchBooks(): Promise<Book[]> {
  const res = await fetch("/api/books");
  if (!res.ok) throw new Error("Failed to load books");
  return res.json();
}

export default function EntryDetailPage({
  params,
}: {
  params: Promise<{ entryId: string }>;
}) {
  const { entryId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["entries", entryId],
    queryFn: () => fetchEntry(entryId),
  });
  const { data: allEntries } = useQuery({ queryKey: ["entries"], queryFn: fetchAllEntries });
  const { data: books } = useQuery({ queryKey: ["books"], queryFn: fetchBooks });

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", summary: "", content: "" });
  const [dateForm, setDateForm] = useState(emptyEntryDateForm());
  const [editError, setEditError] = useState<string | null>(null);

  const [linkQuery, setLinkQuery] = useState("");
  const [linkType, setLinkType] = useState("relates_to");
  const [showLinkPicker, setShowLinkPicker] = useState(false);
  const [showBookPicker, setShowBookPicker] = useState(false);
  const [bookQuery, setBookQuery] = useState("");

  const updateMutation = useMutation({
    mutationFn: async () => {
      const datePayload = entryDateFormToPayload(dateForm);
      if ("error" in datePayload) throw new Error(datePayload.error);

      const res = await fetch(`/api/entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, ...datePayload }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to update entry");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries", entryId] });
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      setEditing(false);
      setEditError(null);
    },
    onError: (err: Error) => setEditError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/entries/${entryId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete entry");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      router.push("/timeline");
    },
  });

  const addLinkMutation = useMutation({
    mutationFn: async (target: {
      targetEntryId?: number;
      targetBookId?: number;
      linkType?: string;
    }) => {
      const res = await fetch(`/api/entries/${entryId}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetEntryId: target.targetEntryId,
          targetBookId: target.targetBookId,
          linkType: target.linkType ?? linkType,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to add link");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries", entryId] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      setShowLinkPicker(false);
      setShowBookPicker(false);
      setLinkQuery("");
      setBookQuery("");
    },
  });

  const removeLinkMutation = useMutation({
    mutationFn: async ({ linkId, sourceEntryId }: { linkId: number; sourceEntryId: number }) => {
      const res = await fetch(`/api/entries/${sourceEntryId}/links/${linkId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove link");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries", entryId] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });

  if (isLoading || !data) {
    return <p className="text-muted">Loading...</p>;
  }

  const { entry, outgoing, backlinks } = data;
  const linkedBookLinks = linkedBooksWithSource(entry.id, outgoing, backlinks);
  const linkedBookIds = new Set(
    linkedBookLinks.map((link) => link.entry.bookId).filter((id): id is number => id != null),
  );
  const bookCandidates = (books ?? [])
    .filter(
      (book) =>
        !linkedBookIds.has(book.id) && book.title.toLowerCase().includes(bookQuery.toLowerCase()),
    )
    .slice(0, 12);
  const genericOutgoing =
    entry.kind === "person" ? outgoing.filter((l) => l.entry.kind !== "book") : outgoing;
  const genericBacklinks =
    entry.kind === "person" ? backlinks.filter((l) => l.entry.kind !== "book") : backlinks;
  const candidates = (allEntries ?? []).filter(
    (e) =>
      e.id !== entry.id &&
      e.kind !== "book" &&
      !outgoing.some((o) => o.entry.id === e.id) &&
      e.title.toLowerCase().includes(linkQuery.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <span className="rounded bg-surface-raised px-2 py-0.5 text-xs font-medium text-foreground/80">
            {kindLabel[entry.kind]}
          </span>
          {!editing ? (
            <h1 className="mt-2 text-2xl font-semibold text-foreground">{entry.title}</h1>
          ) : (
            <input
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="mt-2 w-full rounded border border-border-strong bg-background px-2 py-1.5 text-xl"
            />
          )}
          <p className="mt-1 text-sm text-muted">{formatEntryDateRange(entry)}</p>
        </div>
        <div className="flex gap-2">
          {entry.kind !== "book" && (
            <button
              onClick={() => {
                if (!editing) {
                  setEditForm({
                    title: entry.title,
                    summary: entry.summary ?? "",
                    content: entry.content ?? "",
                  });
                  setDateForm(entryDateFormFromEntry(entry));
                  setEditError(null);
                }
                setEditing((v) => !v);
              }}
              className="flex items-center gap-1 text-sm text-muted hover:text-foreground"
            >
              <Pencil size={14} />
              {editing ? "Cancel" : "Edit"}
            </button>
          )}
          <button
            onClick={() => {
              if (confirm(`Delete "${entry.title}"?`)) deleteMutation.mutate();
            }}
            className="flex items-center gap-1 text-sm text-muted hover:text-red-400"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>

      {entry.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={entry.imageUrl}
          alt={entry.title}
          className="max-h-72 rounded-lg border border-border object-cover"
        />
      )}

      {editing ? (
        <div className="space-y-3 rounded-lg border border-border bg-surface/40 p-4">
          <EntryDateFields value={dateForm} onChange={setDateForm} />
          <label className="flex flex-col gap-1 text-sm">
            Summary
            <input
              value={editForm.summary}
              onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
              className="rounded border border-border-strong bg-background px-2 py-1.5"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Content
            <textarea
              rows={6}
              value={editForm.content}
              onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
              className="rounded border border-border-strong bg-background px-2 py-1.5"
            />
          </label>
          {editError && <p className="text-sm text-red-400">{editError}</p>}
          <div className="flex justify-end">
            <button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:brightness-110"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {entry.summary && <p className="text-foreground/80">{entry.summary}</p>}
          {entry.content && (
            <p className="whitespace-pre-wrap text-sm text-muted">{entry.content}</p>
          )}
        </div>
      )}

      {entry.kind === "person" && (
        <div className="rounded-lg border border-border bg-surface/30 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <BookOpen size={14} />
              Books
            </h2>
            <button
              onClick={() => setShowBookPicker((value) => !value)}
              className="flex items-center gap-1 text-xs text-gold hover:underline"
            >
              <Link2 size={12} />
              Link book
            </button>
          </div>

          {showBookPicker && (
            <div className="mb-3 space-y-2 rounded border border-border bg-background/60 p-2">
              <input
                value={bookQuery}
                onChange={(e) => setBookQuery(e.target.value)}
                placeholder="Search your books..."
                className="w-full rounded border border-border-strong bg-background px-2 py-1 text-sm"
              />
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {bookCandidates.map((book) => (
                  <button
                    key={book.id}
                    onClick={() =>
                      addLinkMutation.mutate({ targetBookId: book.id, linkType: "appears_in" })
                    }
                    className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-sm hover:bg-surface-raised"
                  >
                    <span>{book.title}</span>
                    {book.author && <span className="text-xs text-muted">{book.author}</span>}
                  </button>
                ))}
                {bookCandidates.length === 0 && (
                  <p className="px-2 py-1 text-xs text-muted">No matching books.</p>
                )}
              </div>
            </div>
          )}

          {linkedBookLinks.length === 0 ? (
            <p className="text-sm text-muted">Not linked to any books yet.</p>
          ) : (
            <ul className="space-y-1">
              {linkedBookLinks.map((link) => (
                <li key={link.linkId} className="flex items-center justify-between text-sm">
                  <Link href={entryHref(link.entry)} className="text-foreground hover:text-gold-bright">
                    {link.entry.title}
                    <span className="ml-2 text-xs text-muted">({link.linkType})</span>
                  </Link>
                  <button
                    onClick={() =>
                      removeLinkMutation.mutate({
                        linkId: link.linkId,
                        sourceEntryId: link.sourceEntryId,
                      })
                    }
                    className="text-subtle hover:text-red-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="rounded-lg border border-border bg-surface/30 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <ArrowRight size={14} />
            Links from this entry
          </h2>
          <button
            onClick={() => setShowLinkPicker((v) => !v)}
            className="flex items-center gap-1 text-xs text-gold hover:underline"
          >
            <Link2 size={12} />
            Add link
          </button>
        </div>

        {showLinkPicker && (
          <div className="mb-3 space-y-2 rounded border border-border bg-background/60 p-2">
            <div className="flex gap-2">
              <input
                value={linkQuery}
                onChange={(e) => setLinkQuery(e.target.value)}
                placeholder="Search entries to link..."
                className="flex-1 rounded border border-border-strong bg-background px-2 py-1 text-sm"
              />
              <input
                value={linkType}
                onChange={(e) => setLinkType(e.target.value)}
                placeholder="link type"
                className="w-32 rounded border border-border-strong bg-background px-2 py-1 text-sm"
              />
            </div>
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {candidates.slice(0, 12).map((c) => (
                <button
                  key={c.id}
                  onClick={() => addLinkMutation.mutate({ targetEntryId: c.id })}
                  className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-sm hover:bg-surface-raised"
                >
                  <span>{c.title}</span>
                  <span className="text-xs text-muted">
                    {kindLabel[c.kind]} · {formatEntryDateRange(c)}
                  </span>
                </button>
              ))}
              {candidates.length === 0 && (
                <p className="px-2 py-1 text-xs text-muted">No matching entries.</p>
              )}
            </div>
          </div>
        )}

        {genericOutgoing.length === 0 ? (
          <p className="text-sm text-muted">No outgoing links yet.</p>
        ) : (
          <ul className="space-y-1">
            {genericOutgoing.map((l) => (
              <li key={l.linkId} className="flex items-center justify-between text-sm">
                <Link href={entryHref(l.entry)} className="text-foreground hover:text-gold-bright">
                  {l.entry.title}
                  <span className="ml-2 text-xs text-muted">({l.linkType})</span>
                </Link>
                <button
                  onClick={() =>
                    removeLinkMutation.mutate({ linkId: l.linkId, sourceEntryId: entry.id })
                  }
                  className="text-subtle hover:text-red-400"
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-border bg-surface/30 p-4">
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
          <ArrowLeft size={14} />
          Backlinks
        </h2>
        {genericBacklinks.length === 0 ? (
          <p className="text-sm text-muted">Nothing links here yet.</p>
        ) : (
          <ul className="space-y-1">
            {genericBacklinks.map((l) => (
              <li key={l.linkId} className="text-sm">
                <Link href={entryHref(l.entry)} className="text-foreground hover:text-gold-bright">
                  {l.entry.title}
                </Link>
                <span className="ml-2 text-xs text-muted">({l.linkType})</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
