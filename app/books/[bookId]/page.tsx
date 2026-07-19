"use client";

import { use, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Link2, Lock, Sparkles, Trash2, User } from "lucide-react";
import type { Book, Character, Era, TimelineEntry } from "@/lib/types";
import { BookCampaignMiniMap } from "@/components/book-campaign-mini-map";
import { CharacterArt } from "@/components/character-art";
import {
  CharacterCardHeader,
  CopyCountBadge,
  EventBadge,
  LocationBadge,
  RarityPill,
  UnitBadge,
} from "@/components/character-badges";
import { CharacterCardModal } from "@/components/character-card-modal";
import { ReadingSessionTimer } from "@/components/reading-session-timer";
import { ReadingProgressBar } from "@/components/reading-progress-bar";
import { useCardModalNavigation } from "@/lib/client/use-card-modal-navigation";
import { entryHref, linkedPeopleWithSource, type LinkedEntry } from "@/lib/entry-links";
import { formatMilestonePercents } from "@/lib/format";
import { imageFrameFromCharacter } from "@/lib/image-frame";
import { CARD_TYPE_ICONS, CARD_TYPE_LABELS_PLURAL, CARD_TYPES, type CardType } from "@/lib/card-types";
import { RARITY_META } from "@/lib/rarity";

type BookCard = Character & {
  era: Era;
  owned: boolean;
  quantity: number;
  sortOrder: number;
};

type BookDetail = Book & {
  timelineEntryId: number | null;
  outgoing: LinkedEntry[];
  backlinks: LinkedEntry[];
  cards: BookCard[];
  readingRules: {
    milestones: number[];
    pointsPerMilestone: number;
    maxPerBook: number;
  };
  earnedMilestones: number[];
};

async function fetchBook(id: string): Promise<BookDetail> {
  const res = await fetch(`/api/books/${id}`);
  if (!res.ok) throw new Error("Failed to load book");
  return res.json();
}

async function fetchPersonEntries(): Promise<TimelineEntry[]> {
  const res = await fetch("/api/entries?kind=person");
  if (!res.ok) throw new Error("Failed to load people");
  return res.json();
}

async function fetchEras(): Promise<Era[]> {
  const res = await fetch("/api/eras");
  if (!res.ok) throw new Error("Failed to load eras");
  return res.json();
}

type ProgressResult = {
  book: Book;
  awardedMilestones: string[];
  awardedPoints: number;
  pointsPerMilestone: number;
};

const statusLabel: Record<Book["status"], string> = {
  to_read: "To read",
  reading: "Reading",
  finished: "Finished",
};

const statusColor: Record<Book["status"], string> = {
  to_read: "bg-neutral-800 text-neutral-300",
  reading: "bg-amber-900/50 text-amber-200",
  finished: "bg-emerald-900/50 text-emerald-200",
};

export default function BookDetailPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: book, isLoading } = useQuery({
    queryKey: ["books", bookId],
    queryFn: () => fetchBook(bookId),
  });
  const { data: eras } = useQuery({ queryKey: ["eras"], queryFn: fetchEras });
  const { data: personEntries } = useQuery({
    queryKey: ["entries", "person"],
    queryFn: fetchPersonEntries,
  });

  const pageInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showPersonPicker, setShowPersonPicker] = useState(false);
  const [personQuery, setPersonQuery] = useState("");
  const [viewingCardId, setViewingCardId] = useState<number | null>(null);

  const bookCards = book?.cards ?? [];
  const cardsByType = useMemo(() => {
    const groups: Record<CardType, BookCard[]> = {
      character: [],
      location: [],
      unit: [],
      event: [],
    };
    for (const card of bookCards) {
      groups[card.cardType].push(card);
    }
    for (const cardType of CARD_TYPES) {
      groups[cardType].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
      );
    }
    return groups;
  }, [bookCards]);
  const { viewing: viewingCard, onPrevious, onNext, positionLabel } = useCardModalNavigation(
    bookCards,
    viewingCardId,
    setViewingCardId,
  );

  const progressMutation = useMutation({
    mutationFn: async (currentPage: number) => {
      const res = await fetch(`/api/books/${bookId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPage }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to update progress");
      }
      return res.json() as Promise<ProgressResult>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["books", bookId], (current: BookDetail | undefined) =>
        current
          ? {
              ...current,
              ...data.book,
              earnedMilestones: [
                ...new Set([
                  ...current.earnedMilestones,
                  ...data.awardedMilestones.map((type) => Number(type.replace("milestone_", ""))),
                ]),
              ].sort((a, b) => a - b),
            }
          : data.book,
      );
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      if (data.awardedMilestones.length > 0) {
        setToast(`+${data.awardedPoints} points! (${data.awardedMilestones.join(", ")})`);
        setTimeout(() => setToast(null), 4000);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/books/${bookId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove book");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["catalog-books"] });
      router.push("/books");
    },
  });

  const addPersonLinkMutation = useMutation({
    mutationFn: async (targetEntryId: number) => {
      const res = await fetch(`/api/books/${bookId}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetEntryId, linkType: "appears_in" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to link person");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books", bookId] });
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      setShowPersonPicker(false);
      setPersonQuery("");
    },
  });

  const removePersonLinkMutation = useMutation({
    mutationFn: async ({ linkId, sourceEntryId }: { linkId: number; sourceEntryId: number }) => {
      const res = await fetch(`/api/entries/${sourceEntryId}/links/${linkId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove link");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books", bookId] });
      queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
  });

  if (isLoading || !book) {
    return <p className="text-neutral-500">Loading...</p>;
  }

  const currentBook = book;
  const era = eras?.find((e) => e.id === currentBook.eraId);
  const pct = Math.min(100, Math.round((currentBook.currentPage / currentBook.totalPages) * 100));
  const milestones = currentBook.readingRules?.milestones ?? [25, 50, 75, 100];
  const pointsPerMilestone = currentBook.readingRules?.pointsPerMilestone ?? 25;
  const maxPerBook = currentBook.readingRules?.maxPerBook ?? milestones.length * pointsPerMilestone;
  const earnedMilestones = currentBook.earnedMilestones ?? [];
  const linkedPeople = linkedPeopleWithSource(
    currentBook.timelineEntryId ?? 0,
    currentBook.outgoing,
    currentBook.backlinks,
  );
  const linkedPersonIds = new Set(linkedPeople.map((link) => link.entry.id));
  const personCandidates = (personEntries ?? [])
    .filter(
      (entry) =>
        !linkedPersonIds.has(entry.id) &&
        entry.title.toLowerCase().includes(personQuery.toLowerCase()),
    )
    .slice(0, 12);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link
        href="/books"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-400 transition-colors hover:text-neutral-200"
      >
        <ArrowLeft size={15} />
        Back to books
      </Link>

      {toast && (
        <div className="rounded-lg border border-amber-700 bg-amber-950/70 px-4 py-2 text-sm text-amber-200">
          {toast}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/40">
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,200px)_1fr] lg:gap-8">
          <aside className="mx-auto w-full max-w-[200px] lg:mx-0">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-neutral-800">
              {currentBook.coverUrl ? (
                <Image
                  src={currentBook.coverUrl}
                  alt={currentBook.title}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-neutral-600">
                  <BookOpen size={32} />
                </div>
              )}
            </div>
          </aside>

          <div className="flex min-w-0 flex-col gap-4">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${statusColor[currentBook.status]}`}
                >
                  {statusLabel[currentBook.status]}
                </span>
                {era && (
                  <span
                    className="rounded px-2 py-0.5 text-xs font-medium"
                    style={{
                      background: `${era.colorPrimary}33`,
                      color: era.colorPrimary,
                    }}
                  >
                    {era.name}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-semibold text-amber-100 sm:text-3xl">
                {currentBook.title}
              </h1>
              {currentBook.author && (
                <p className="text-base text-neutral-400">by {currentBook.author}</p>
              )}
            </div>

            {currentBook.summary ? (
              <div className="rounded-lg border border-neutral-800/80 bg-neutral-950/50 p-4">
                <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
                  About this book
                </h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-300">
                  {currentBook.summary}
                </p>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">Platform catalog entry — no summary provided.</p>
            )}

            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-lg border border-neutral-800/80 bg-neutral-950/40 px-3 py-2">
                <dt className="text-xs text-neutral-500">Total pages</dt>
                <dd className="mt-0.5 font-medium text-neutral-200">{currentBook.totalPages}</dd>
              </div>
              <div className="rounded-lg border border-neutral-800/80 bg-neutral-950/40 px-3 py-2">
                <dt className="text-xs text-neutral-500">Current page</dt>
                <dd className="mt-0.5 font-medium text-neutral-200">{currentBook.currentPage}</dd>
              </div>
              <div className="rounded-lg border border-neutral-800/80 bg-neutral-950/40 px-3 py-2">
                <dt className="text-xs text-neutral-500">Progress</dt>
                <dd className="mt-0.5 font-medium text-amber-200">{pct}%</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {era && <BookCampaignMiniMap eraSlug={era.slug} eraName={era.name} />}

      <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <BookOpen size={16} className="text-amber-500" />
              <h2 className="text-lg font-medium text-neutral-100">Reading progress</h2>
            </div>

            <div className="mb-1 flex items-center justify-between text-sm text-neutral-400">
              <span>
                Page {currentBook.currentPage} of {currentBook.totalPages}
              </span>
              <span className="font-medium text-amber-200">{pct}% complete</span>
            </div>
            <ReadingProgressBar
              progressPercent={pct}
              milestones={milestones}
              earnedMilestones={earnedMilestones}
            />
            <p className="mt-3 text-xs text-neutral-500">
              Earn {pointsPerMilestone} points at each milestone ({formatMilestonePercents(milestones)})
              as you read — up to {maxPerBook} points per book.
            </p>
            {earnedMilestones.length > 0 ? (
              <p className="mt-1 text-xs text-emerald-500/90">
                Milestones collected: {earnedMilestones.map((m) => `${m}%`).join(", ")}
              </p>
            ) : null}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const value = Number(pageInputRef.current?.value ?? 0);
                progressMutation.mutate(value);
              }}
              className="mt-5 flex flex-col gap-3 border-t border-neutral-800 pt-5 sm:flex-row sm:items-end"
            >
              <label className="flex flex-1 flex-col gap-1 text-sm">
                Update current page
                <input
                  key={currentBook.currentPage}
                  ref={pageInputRef}
                  type="number"
                  min={0}
                  max={currentBook.totalPages}
                  defaultValue={currentBook.currentPage}
                  className="max-w-xs rounded border border-neutral-700 bg-neutral-950 px-3 py-2"
                />
              </label>
              <button
                type="submit"
                disabled={progressMutation.isPending}
                className="rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-amber-600 disabled:opacity-50 sm:shrink-0"
              >
                {progressMutation.isPending ? "Saving…" : "Save progress"}
              </button>
            </form>
            {progressMutation.isError && (
              <p className="mt-2 text-sm text-red-400">
                {(progressMutation.error as Error).message}
              </p>
            )}

            <ReadingSessionTimer
              bookId={currentBook.id}
              currentPage={currentBook.currentPage}
              totalPages={currentBook.totalPages}
              onFinalized={(result) => {
                queryClient.setQueryData(["books", bookId], (current: BookDetail | undefined) =>
                  current
                    ? {
                        ...current,
                        ...result.book,
                        earnedMilestones: [
                          ...new Set([
                            ...current.earnedMilestones,
                            ...result.awardedMilestones.map((type) =>
                              Number(type.replace("milestone_", "")),
                            ),
                          ]),
                        ].sort((a, b) => a - b),
                      }
                    : current,
                );
                queryClient.invalidateQueries({ queryKey: ["stats"] });
                if (era) {
                  queryClient.invalidateQueries({ queryKey: ["campaign", era.slug] });
                }
                if (result.awardedPoints > 0) {
                  setToast(`+${result.awardedPoints} points! (${result.awardedMilestones.join(", ")})`);
                  setTimeout(() => setToast(null), 4000);
                } else if (result.pendingPoints > 0) {
                  setToast(`${result.pendingPoints} points pending review (${result.awardedMilestones.join(", ")})`);
                  setTimeout(() => setToast(null), 5000);
                } else if (result.velocity.flagged) {
                  setToast("Session flagged for review — progress saved, points held.");
                  setTimeout(() => setToast(null), 5000);
                }
              }}
            />
          </section>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={16} className="text-amber-500" />
          <h2 className="text-lg font-medium text-neutral-100">Cards in this book</h2>
        </div>

        {(currentBook.cards?.length ?? 0) === 0 ? (
          <p className="text-sm text-neutral-500">
            No collectible cards have been linked to this title yet.
          </p>
        ) : (
          <div className="space-y-6">
            {CARD_TYPES.map((cardType) => {
              const cards = cardsByType[cardType];
              if (cards.length === 0) return null;
              const Icon = CARD_TYPE_ICONS[cardType];
              return (
                <div key={cardType}>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-neutral-300">
                    <Icon size={14} className="text-neutral-500" />
                    {CARD_TYPE_LABELS_PLURAL[cardType]}
                    <span className="font-normal text-neutral-500">({cards.length})</span>
                  </h3>
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {cards.map((card) => {
                      const meta = RARITY_META[card.rarity];
                      return (
                        <li key={card.id}>
                          <button
                            type="button"
                            onClick={() => setViewingCardId(card.id)}
                            className={`group relative flex h-full w-full flex-col overflow-hidden rounded-xl border-2 p-2.5 text-left transition-transform hover:scale-[1.02] ${
                              card.owned ? "" : "opacity-95"
                            }`}
                            style={{
                              borderColor: card.owned ? meta.color : "#404040",
                              boxShadow: card.owned ? meta.glow : "none",
                              background: `linear-gradient(160deg, ${card.era.colorPrimary}22, ${card.era.colorSecondary}22), #111110`,
                            }}
                          >
                            <CharacterCardHeader
                              name={card.name}
                              rarity={card.rarity}
                              variant="compact"
                              nameClassName="text-[11px] font-semibold leading-tight text-neutral-100"
                              starSize={9}
                            />

                            <div className="relative my-2 flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/30">
                              <CharacterArt
                                seed={card.seed}
                                imageUrl={card.imageUrl}
                                imageFrame={imageFrameFromCharacter(card)}
                                era={card.era}
                                rarity={card.rarity}
                                archetype={card.archetype}
                                size={160}
                                className={card.owned ? "" : "opacity-45 grayscale"}
                              />
                              {!card.owned && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-neutral-950/40">
                                  <Lock size={20} className="text-neutral-300 drop-shadow" />
                                  <span className="text-[10px] font-medium text-neutral-400">Locked</span>
                                </div>
                              )}
                            </div>

                            <div className="mt-auto flex flex-wrap items-center gap-1">
                              <RarityPill label={meta.label} color={meta.color} size="compact" />
                              {card.cardType === "location" && <LocationBadge size="compact" />}
                              {card.cardType === "unit" && <UnitBadge size="compact" />}
                              {card.cardType === "event" && <EventBadge size="compact" />}
                            </div>

                            <p className="mt-1 truncate text-[10px] text-neutral-500">{card.era.name}</p>

                            {card.owned ? (
                              card.quantity > 1 ? (
                                <CopyCountBadge quantity={card.quantity} className="mt-1" />
                              ) : (
                                <span className="mt-1 text-[10px] font-medium text-emerald-400">Owned</span>
                              )
                            ) : (
                              <span className="mt-1 text-[10px] font-medium text-neutral-500">Tap to preview</span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
        {(currentBook.cards?.length ?? 0) > 0 && (
          <p className="mt-3 text-xs text-neutral-500">
            Read to earn points, then open booster packs to collect these cards.
          </p>
        )}
      </section>

      {viewingCard && (
        <CharacterCardModal
          character={viewingCard}
          onClose={() => setViewingCardId(null)}
          locked={!viewingCard.owned}
          showOwnershipStatus
          onPrevious={onPrevious}
          onNext={onNext}
          positionLabel={positionLabel}
        />
      )}

      <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <User size={16} className="text-amber-500" />
            <h2 className="text-lg font-medium text-neutral-100">People in this book</h2>
          </div>
          <button
            type="button"
            onClick={() => setShowPersonPicker((value) => !value)}
            disabled={!currentBook.timelineEntryId}
            className="flex items-center gap-1 text-xs text-amber-400 hover:underline disabled:text-neutral-600"
          >
            <Link2 size={12} />
            Link person
          </button>
        </div>

        {showPersonPicker && (
              <div className="mb-4 space-y-2 rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
                <input
                  value={personQuery}
                  onChange={(e) => setPersonQuery(e.target.value)}
                  placeholder="Search people..."
                  className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm"
                />
                <div className="max-h-40 space-y-1 overflow-y-auto">
                  {personCandidates.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => addPersonLinkMutation.mutate(person.id)}
                      className="flex w-full rounded px-2 py-1.5 text-left text-sm hover:bg-neutral-800"
                    >
                      {person.title}
                    </button>
                  ))}
                  {personCandidates.length === 0 && (
                    <p className="px-2 py-1 text-xs text-neutral-500">No matching people.</p>
                  )}
                </div>
              </div>
        )}

        {linkedPeople.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Link historical people you encounter while reading this book.
          </p>
        ) : (
          <ul className="space-y-2">
            {linkedPeople.map((link) => (
              <li key={link.linkId} className="flex items-center justify-between gap-3 text-sm">
                <Link
                  href={entryHref(link.entry)}
                  className="min-w-0 truncate font-medium text-neutral-200 hover:text-amber-300"
                >
                  {link.entry.title}
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-neutral-500">{link.linkType}</span>
                  <button
                    type="button"
                    onClick={() =>
                      removePersonLinkMutation.mutate({
                        linkId: link.linkId,
                        sourceEntryId: link.sourceEntryId,
                      })
                    }
                    className="text-neutral-600 hover:text-red-400"
                    aria-label={`Remove link to ${link.entry.title}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-red-900/30 bg-red-950/10 p-5">
        <h2 className="text-sm font-medium text-red-200/90">Remove from library</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Removes this title from your shelf, its timeline entry, and reading milestones. The platform
          catalog entry stays available for others.
        </p>
        <button
          onClick={() => {
            if (confirm(`Remove "${currentBook.title}" from your library?`)) {
              deleteMutation.mutate();
            }
          }}
          className="mt-3 flex items-center gap-1.5 rounded-md border border-red-900/50 px-3 py-1.5 text-sm text-red-300 hover:bg-red-950/40"
        >
          <Trash2 size={14} />
          Remove from library
        </button>
      </section>
    </div>
  );
}
