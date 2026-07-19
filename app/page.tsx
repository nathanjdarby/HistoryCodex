"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
  BookMarked,
  BookOpen,
  Coins,
  Sparkles,
  Star,
  Trophy,
  Users2,
} from "lucide-react";
import type { Book, Character, Era, UserStats } from "@/lib/types";
import { CharacterArt } from "@/components/character-art";
import { HolographicOverlay } from "@/components/holographic-overlay";
import { imageFrameFromCharacter } from "@/lib/image-frame";
import { RARITY_META } from "@/lib/rarity";

type CharacterWithEra = Character & { era: Era; owned: boolean; unlockedAt: string | null };

type EraBalance = {
  eraId: number;
  eraName: string;
  eraSlug: string;
  colorPrimary: string;
  pointsBalance: number;
};

type DashboardStats = UserStats & { eraBalances?: EraBalance[] };

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  return res.json();
}

function progressPct(book: Book) {
  if (book.totalPages <= 0) return 0;
  return Math.min(100, Math.round((book.currentPage / book.totalPages) * 100));
}

function BookPreviewCard({
  book,
  showProgress = false,
}: {
  book: Book;
  showProgress?: boolean;
}) {
  const pct = progressPct(book);

  return (
    <Link
      href={`/books/${book.id}`}
      className="group w-[9.5rem] shrink-0 rounded-lg border border-neutral-800 bg-neutral-900/40 p-2.5 transition-colors hover:border-amber-700/50 sm:w-auto"
    >
      <div className="relative mb-2 aspect-[2/3] w-full overflow-hidden rounded-md bg-neutral-800 shadow-sm ring-1 ring-white/5">
        {book.coverUrl ? (
          <Image
            src={book.coverUrl}
            alt={book.title}
            fill
            sizes="(max-width: 640px) 152px, 180px"
            className="object-cover transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-600">
            <BookOpen size={28} />
          </div>
        )}
      </div>
      <p className="line-clamp-2 text-sm font-medium leading-snug text-neutral-100">{book.title}</p>
      {book.author && <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">{book.author}</p>}
      {showProgress ? (
        <>
          <p className="mt-1.5 text-[11px] text-neutral-500">
            Page {book.currentPage} / {book.totalPages}
          </p>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-neutral-800">
            <div className="h-full bg-amber-600" style={{ width: `${pct}%` }} />
          </div>
        </>
      ) : (
        <p className="mt-1.5 text-[11px] text-neutral-500">{book.totalPages} pages</p>
      )}
    </Link>
  );
}

function BookShelfSection({
  title,
  icon: Icon,
  books,
  emptyMessage,
  emptyAction,
  showProgress = false,
}: {
  title: string;
  icon: typeof BookOpen;
  books: Book[];
  emptyMessage: string;
  emptyAction?: { href: string; label: string };
  showProgress?: boolean;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-medium text-neutral-200">
          <Icon size={15} />
          {title}
        </h2>
        <Link href="/books" className="text-xs text-amber-400 hover:underline">
          View all books
        </Link>
      </div>

      {books.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-800 bg-neutral-900/20 px-4 py-5 text-sm text-neutral-500">
          {emptyMessage}
          {emptyAction && (
            <div className="mt-2">
              <Link href={emptyAction.href} className="text-amber-400 hover:underline">
                {emptyAction.label}
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {books.map((book) => (
            <BookPreviewCard key={book.id} book={book} showProgress={showProgress} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: () => fetchJson<DashboardStats>("/api/stats"),
  });
  const { data: books } = useQuery({ queryKey: ["books"], queryFn: () => fetchJson<Book[]>("/api/books") });
  const { data: characters } = useQuery({
    queryKey: ["characters"],
    queryFn: () => fetchJson<CharacterWithEra[]>("/api/characters"),
  });

  const toRead = [...(books ?? [])]
    .filter((book) => book.status === "to_read")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);
  const inProgress = [...(books ?? [])]
    .filter((book) => book.status === "reading")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8);
  const recentUnlocks = (characters ?? [])
    .filter((c) => c.owned && c.unlockedAt)
    .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
    .slice(0, 6);

  const hasNothingYet = books?.length === 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-amber-100">Welcome back</h1>
        <p className="text-sm text-neutral-400">
          Your reading, gamified — track progress, log history, and collect characters as you go.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Sparkles} label="Points balance" value={stats?.pointsBalance ?? 0} />
        <StatTile icon={Trophy} label="Total earned" value={stats?.totalPointsEarned ?? 0} />
        <StatTile icon={BookOpen} label="Books finished" value={stats?.booksFinished ?? 0} />
        <StatTile icon={Users2} label="Characters unlocked" value={characters?.filter((c) => c.owned).length ?? 0} />
      </div>

      {(stats?.eraBalances?.length ?? 0) > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-1.5 text-sm font-medium text-neutral-200">
              <Coins size={15} />
              Era points
            </h2>
            <Link href="/packs" className="text-xs text-amber-400 hover:underline">
              Open packs
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats!.eraBalances!.map((era) => (
              <Link
                key={era.eraId}
                href={`/campaigns/${era.eraSlug}`}
                className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/40 px-3 py-2 transition-colors hover:border-neutral-700"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: era.colorPrimary }}
                />
                <span className="text-sm text-neutral-300">{era.eraName}</span>
                <span className="text-sm font-semibold text-amber-200">{era.pointsBalance}</span>
              </Link>
            ))}
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            Era points are spent on era-locked booster packs in the shop.
          </p>
        </section>
      )}

      {hasNothingYet && (
        <div className="rounded-lg border border-dashed border-neutral-700 bg-neutral-900/30 p-6 text-center">
          <p className="text-neutral-300">Your codex is empty. Browse the catalog to start reading.</p>
          <div className="mt-3 flex justify-center gap-2">
            <Link
              href="/books/browse"
              className="rounded-md bg-amber-700 px-3 py-1.5 text-sm font-medium text-amber-50 hover:bg-amber-600"
            >
              Browse catalog
            </Link>
          </div>
        </div>
      )}

      <BookShelfSection
        title="In progress"
        icon={BookOpen}
        books={inProgress}
        showProgress
        emptyMessage="No books in progress yet. Open a book and log your page count to start earning points."
        emptyAction={{ href: "/books", label: "Browse your library" }}
      />

      <BookShelfSection
        title="To read"
        icon={BookMarked}
        books={toRead}
        emptyMessage="Your reading queue is empty."
        emptyAction={{ href: "/books/browse", label: "Browse the catalog" }}
      />

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-medium text-neutral-200">
            <Users2 size={15} />
            Recent unlocks
          </h2>
          <Link href="/collection" className="text-xs text-amber-400 hover:underline">
            View collection
          </Link>
        </div>
        {recentUnlocks.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No characters unlocked yet — earn points by reading, then open{" "}
            <Link href="/packs" className="text-amber-400 hover:underline">
              booster packs
            </Link>
            .
          </p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {recentUnlocks.map((c) => {
              const meta = RARITY_META[c.rarity];
              return (
                <Link
                  href="/collection"
                  key={c.id}
                  className="relative flex w-36 flex-col overflow-hidden rounded-xl border-2 p-3 text-left transition-transform hover:-translate-y-1"
                  style={{
                    borderColor: meta.color,
                    boxShadow: meta.glow,
                    background: `linear-gradient(160deg, ${c.era.colorPrimary}22, ${c.era.colorSecondary}22), #111110`,
                  }}
                >
                  {c.holographic && <HolographicOverlay />}

                  <div className="relative z-[1] flex flex-col">
                    <div className="relative flex h-[104px] w-full items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/30">
                      <CharacterArt
                        seed={c.seed}
                        imageUrl={c.imageUrl}
                        imageFrame={imageFrameFromCharacter(c)}
                        era={c.era}
                        rarity={c.rarity}
                        archetype={c.archetype}
                        size={88}
                      />
                    </div>
                    <span className="mt-2 line-clamp-2 text-left text-sm font-medium text-neutral-100">
                      {c.name}
                    </span>
                    <span className="mt-1 flex items-center gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          size={9}
                          fill={i < meta.stars ? meta.color : "transparent"}
                          stroke={i < meta.stars ? meta.color : "#525252"}
                        />
                      ))}
                    </span>
                    <span className="mt-1 text-[11px] text-neutral-500">{c.era.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Sparkles;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-3">
      <div className="flex items-center gap-1.5 text-xs text-neutral-500">
        <Icon size={13} />
        {label}
      </div>
      <p className="mt-1 text-xl font-semibold text-amber-100">{value}</p>
    </div>
  );
}
