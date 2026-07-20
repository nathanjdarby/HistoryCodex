import Image from "next/image";
import Link from "next/link";
import { Coins, Sparkles, Swords } from "lucide-react";
import { FeaturedBooksShowcase } from "@/components/featured-books-showcase";
import { FeaturedCardsShowcase } from "@/components/featured-cards-showcase";
import type { FeaturedCharacter } from "@/lib/server/characters";
import type { FeaturedCatalogBook } from "@/lib/server/catalog-books";

function StoryChapter({
  step,
  label,
  title,
  description,
  children,
}: {
  step: number;
  label: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative mx-auto max-w-5xl scroll-mt-20 px-1 py-10 sm:py-14">
      <div className="mb-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:gap-5 sm:text-left">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-red-800/60 bg-red-950/50 text-base font-bold text-red-200 shadow-[0_0_20px_-6px_rgba(190,18,60,0.5)] sm:h-12 sm:w-12 sm:text-lg">
          {step}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-red-400/90">{label}</p>
          <h2 className="mt-1 text-2xl font-semibold text-stone-100 sm:text-3xl">{title}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-stone-400 sm:mx-0 sm:text-base">
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

function MilestoneRow({ milestone, reward }: { milestone: string; reward: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-red-950/40 px-4 py-3 last:border-0">
      <span className="text-sm text-stone-400">{milestone}</span>
      <span className="text-sm font-semibold text-gold/95">{reward}</span>
    </div>
  );
}

function HomeDivider() {
  return (
    <div
      aria-hidden
      className="mx-auto h-px max-w-3xl bg-gradient-to-r from-transparent via-red-900/45 to-transparent"
    />
  );
}

export function HomeLanding({
  featuredCards,
  featuredBooks,
  catalogBookCount,
}: {
  featuredCards: FeaturedCharacter[];
  featuredBooks: FeaturedCatalogBook[];
  catalogBookCount: number;
}) {
  return (
    <div className="home-marketing dark min-h-screen pb-4">
      {/* Hero banner */}
      <section className="relative w-full">
        <Image
          src="/images/home-hero-banner.png"
          alt="History Codex — Read, learn, unlock, battle through history"
          width={1024}
          height={576}
          priority
          sizes="100vw"
          className="h-auto w-full"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#060505] via-[#060505]/80 to-transparent"
        />
      </section>

      <div className="relative -mt-2 flex flex-wrap items-center justify-center gap-3 px-4 pb-12 pt-2 sm:pb-14">
        <Link href="/login" className="home-btn-primary">
          Begin your codex
        </Link>
        <Link href="/about" className="home-btn-secondary">
          How it works
        </Link>
      </div>

      <p className="mx-auto -mt-6 max-w-2xl px-4 pb-10 text-center text-[11px] font-medium uppercase tracking-[0.25em] text-red-400/70 sm:text-xs">
        Ancient worlds · Timeless stories · Endless possibilities
      </p>

      {/* 1 — Read */}
      <StoryChapter
        step={1}
        label="Read"
        title="Your books. Your pace. We track the progress."
        description="HistoryCodex isn't a bookstore or e-reader — you read the history you already have, whether that's a paperback on your shelf, a Kindle title, or a library loan. Pick a matching title from our catalog, log your page count as you go, and earn rewards for the reading you're already doing."
      >
        <FeaturedBooksShowcase books={featuredBooks} totalCount={catalogBookCount} marketing />
      </StoryChapter>

      <HomeDivider />

      {/* 2 — Earn */}
      <StoryChapter
        step={2}
        label="Earn"
        title="Points follow every chapter"
        description="As you turn the pages, reading milestones unlock points automatically — reward for the history you're actually working through."
      >
        <div className="home-panel mx-auto max-w-lg overflow-hidden rounded-2xl">
          <div className="flex items-center gap-2 border-b border-red-950/40 bg-red-950/20 px-4 py-3">
            <Coins size={16} className="text-gold/90" />
            <p className="text-sm font-medium text-stone-200">Reading milestones</p>
          </div>
          <MilestoneRow milestone="25% through a book" reward="25 points" />
          <MilestoneRow milestone="50% through a book" reward="25 points" />
          <MilestoneRow milestone="75% through a book" reward="25 points" />
          <MilestoneRow milestone="Finish the book" reward="25 points" />
        </div>
        <p className="mx-auto mt-4 max-w-lg text-center text-sm text-stone-400">
          Up to <strong className="font-medium text-stone-200">100 points per book</strong>. Era
          points stack alongside your balance for era-themed booster packs.
        </p>
      </StoryChapter>

      <HomeDivider />

      {/* 3 — Collect */}
      <StoryChapter
        step={3}
        label="Collect"
        title="Fill your codex with history"
        description="Spend the points you've earned on characters, locations, units, and events — or open booster packs for a surprise pull. Each card is tied to the eras and books you're exploring."
      >
        <FeaturedCardsShowcase cards={featuredCards} />
      </StoryChapter>

      <HomeDivider />

      {/* 4 — Play */}
      <StoryChapter
        step={4}
        label="Play"
        title="Take your collection into battle"
        description="When your codex is ready, build decks from the cards you've earned and fight through the ages you've studied — history you've read, brought to the table."
      >
        <figure className="home-panel mx-auto max-w-4xl overflow-hidden rounded-2xl shadow-[0_0_40px_-12px_rgba(190,18,60,0.35)] ring-1 ring-red-900/40">
          <Image
            src="/images/home-play-showcase.png"
            alt="HistoryCodex match in progress — battle mat with location cards, units on the field, and your hand at the bottom"
            width={1024}
            height={661}
            sizes="(max-width: 896px) 100vw, 896px"
            className="h-auto w-full"
          />
          <figcaption className="border-t border-red-950/40 bg-black/50 px-4 py-3 text-center text-xs text-stone-400 sm:text-sm">
            Play matches on the battle mat — deploy locations, field units, and outmanoeuvre your
            opponent through the Logistics and Campaign phases.
          </figcaption>
        </figure>
        <div className="mt-8 text-center">
          <Link href="/login?next=/play" className="home-btn-primary">
            <Swords size={16} />
            Sign in to play
          </Link>
        </div>
      </StoryChapter>

      {/* Closing */}
      <section className="relative mx-auto max-w-3xl px-4 pb-20 pt-8 text-center">
        <blockquote className="text-lg font-medium leading-relaxed text-stone-200 sm:text-xl">
          &ldquo;Every page turned is a door opened in time.&rdquo;
        </blockquote>
        <p className="mt-3 text-sm text-stone-500">Read first. The rest of your codex will follow.</p>

        <div className="mt-8">
          <Link href="/login" className="home-btn-primary">
            <Sparkles size={16} />
            Open your codex
          </Link>
        </div>
      </section>
    </div>
  );
}
