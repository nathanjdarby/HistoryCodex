import type { TimelineEntry } from "@/lib/types";

export type LinkedEntry = {
  linkId: number;
  linkType: string;
  note: string | null;
  entry: TimelineEntry;
};

export function entryHref(entry: Pick<TimelineEntry, "id" | "kind" | "bookId">): string {
  if (entry.kind === "book" && entry.bookId) return `/books/${entry.bookId}`;
  return `/entries/${entry.id}`;
}

export function linkedPeople(links: LinkedEntry[]): LinkedEntry[] {
  const byId = new Map<number, LinkedEntry>();
  for (const link of links) {
    if (link.entry.kind === "person") byId.set(link.entry.id, link);
  }
  return [...byId.values()].sort((a, b) => a.entry.title.localeCompare(b.entry.title));
}

export function linkedBooks(links: LinkedEntry[]): LinkedEntry[] {
  const byBookId = new Map<number, LinkedEntry>();
  for (const link of links) {
    if (link.entry.kind === "book" && link.entry.bookId) {
      byBookId.set(link.entry.bookId, link);
    }
  }
  return [...byBookId.values()].sort((a, b) => a.entry.title.localeCompare(b.entry.title));
}

export type DirectedLink = LinkedEntry & { sourceEntryId: number };

export function linkedBooksWithSource(
  entryId: number,
  outgoing: LinkedEntry[],
  backlinks: LinkedEntry[],
): DirectedLink[] {
  const byBookId = new Map<number, DirectedLink>();
  for (const link of outgoing) {
    if (link.entry.kind === "book" && link.entry.bookId) {
      byBookId.set(link.entry.bookId, { ...link, sourceEntryId: entryId });
    }
  }
  for (const link of backlinks) {
    if (link.entry.kind === "book" && link.entry.bookId) {
      byBookId.set(link.entry.bookId, { ...link, sourceEntryId: link.entry.id });
    }
  }
  return [...byBookId.values()].sort((a, b) => a.entry.title.localeCompare(b.entry.title));
}

export function linkedPeopleWithSource(
  timelineEntryId: number,
  outgoing: LinkedEntry[],
  backlinks: LinkedEntry[],
): DirectedLink[] {
  const byPersonId = new Map<number, DirectedLink>();
  for (const link of outgoing) {
    if (link.entry.kind === "person") {
      byPersonId.set(link.entry.id, { ...link, sourceEntryId: timelineEntryId });
    }
  }
  for (const link of backlinks) {
    if (link.entry.kind === "person") {
      byPersonId.set(link.entry.id, { ...link, sourceEntryId: link.entry.id });
    }
  }
  return [...byPersonId.values()].sort((a, b) => a.entry.title.localeCompare(b.entry.title));
}
