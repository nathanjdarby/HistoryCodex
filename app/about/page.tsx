import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CircleDot,
  Gift,
  Info,
  Landmark,
  Map,
  ScrollText,
  Sparkles,
  Users2,
} from "lucide-react";

type Section = {
  id: string;
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
};

function GuideSection({ id, title, icon: Icon, children }: Section) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border/80 pt-10 first:border-t-0 first:pt-0">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-gold">
          <Icon size={18} />
        </span>
        {title}
      </h2>
      <div className="space-y-4 text-sm leading-relaxed text-foreground/80">{children}</div>
    </section>
  );
}

function StepList({ steps }: { steps: { title: string; body: string }[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((step, index) => (
        <li
          key={step.title}
          className="flex gap-3 rounded-lg border border-border/80 bg-surface/30 px-4 py-3"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-gold-bright">
            {index + 1}
          </span>
          <div>
            <p className="font-medium text-foreground">{step.title}</p>
            <p className="mt-0.5 text-muted">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-foreground/90">
      {children}
    </p>
  );
}

function InlineLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-medium text-gold hover:text-gold-bright hover:underline">
      {children}
    </Link>
  );
}

const toc = [
  { id: "overview", label: "Overview" },
  { id: "quick-start", label: "Quick start" },
  { id: "timelines", label: "Timelines" },
  { id: "books", label: "Books & reading" },
  { id: "points", label: "Points & milestones" },
  { id: "cards", label: "Collectible cards" },
  { id: "campaigns", label: "Campaigns" },
  { id: "packs", label: "Booster packs" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-8 pb-12 sm:px-6">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-gold">
          <Info size={22} />
          <span className="text-sm font-medium uppercase tracking-wide">About HistoryCodex</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-accent-foreground sm:text-4xl">
          How to use your codex
        </h1>
        <p className="text-base leading-relaxed text-muted">
          HistoryCodex turns history reading into a personal adventure. Track books, build a
          timeline, earn points as you read, and collect characters, locations, units, and events along the
          way.
        </p>
      </header>

      <nav
        aria-label="On this page"
        className="rounded-xl border border-border bg-surface/40 p-4 sm:p-5"
      >
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
          On this page
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {toc.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="flex items-center gap-2 text-sm text-foreground/80 transition-colors hover:text-gold-bright"
              >
                <CircleDot size={12} className="shrink-0 text-subtle" />
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <GuideSection id="overview" title="What is HistoryCodex?" icon={Landmark}>
        <p>
          Think of it as a reading companion with a collectible layer. You choose historical eras to
          follow, add real books to your library, log your progress, and unlock rewards tied to
          what you read.
        </p>
        <p>
          Everything connects through <strong className="font-medium text-foreground">eras</strong>{" "}
          — time periods like Roman Britain or Ancient Greece. Books, cards, campaigns, and timeline
          entries all belong to an era, so your codex stays organised by the history you care about.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { label: "Read", desc: "Add books and track pages as you go" },
            { label: "Earn", desc: "Hit milestones to collect points" },
            { label: "Collect", desc: "Unlock characters, locations, units, and events" },
            { label: "Explore", desc: "Follow campaigns and build your timeline" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-border/80 bg-background/50 px-4 py-3"
            >
              <p className="text-sm font-medium text-gold-bright">{item.label}</p>
              <p className="mt-0.5 text-xs text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </GuideSection>

      <GuideSection id="quick-start" title="Quick start" icon={Sparkles}>
        <p>New here? Follow these steps to get the most out of the app.</p>
        <StepList
          steps={[
            {
              title: "Choose your timelines",
              body: "Open My timelines and pick the historical eras you want to explore. You need at least one era before adding books from that period.",
            },
            {
              title: "Browse and add a book",
              body: "Go to Books → browse the catalog, pick a title, and add it to your library. Each book belongs to an era and may include collectible cards to discover.",
            },
            {
              title: "Start reading and log progress",
              body: "Open the book page, use the reading timer or update your current page. Every 25% of the book earns you points.",
            },
            {
              title: "Spend points on cards",
              body: "Visit your Collection to unlock specific cards, or open Booster packs for a random pull from an era.",
            },
            {
              title: "Watch your campaign map grow",
              body: "As you hit reading milestones, nodes unlock on that era's campaign map — a visual record of your journey through the period.",
            },
          ]}
        />
        <Tip>
          Your <InlineLink href="/dashboard">Dashboard</InlineLink> shows points, books in progress, and
          recent unlocks at a glance.
        </Tip>
      </GuideSection>

      <GuideSection id="timelines" title="Timelines" icon={ScrollText}>
        <p>
          The <InlineLink href="/timeline">Timeline</InlineLink> is your personal historical
          notebook. It shows events, people, notes, and books arranged by year.
        </p>
        <p>
          On <InlineLink href="/profile/timelines">My timelines</InlineLink>, you choose which eras
          appear in your codex. Only cards and books from your selected eras will be available to
          you — so pick the periods you are actually reading about.
        </p>
        <ul className="list-inside list-disc space-y-1.5 text-muted">
          <li>Create entries for people, events, or notes you discover while reading</li>
          <li>Link entries together — for example, connect a person to a book they appear in</li>
          <li>Books you add automatically create a timeline entry for that title</li>
        </ul>
      </GuideSection>

      <GuideSection id="books" title="Books & reading" icon={BookOpen}>
        <p>
          Books live in two places: the platform <InlineLink href="/books/browse">catalog</InlineLink>{" "}
          (curated titles everyone can browse) and <InlineLink href="/books">your library</InlineLink>{" "}
          (titles you have added).
        </p>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Adding a book</h3>
          <p className="text-muted">
            Browse the catalog, pick a book, and add it to your shelf. You must be subscribed to
            that book&apos;s era first. Each title can only be added once.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Tracking progress</h3>
          <p className="text-muted">
            On a book&apos;s detail page you can update your current page or use the{" "}
            <strong className="text-foreground/80">reading timer</strong> for timed sessions. Progress
            is shown as a percentage bar with milestone markers at 25%, 50%, 75%, and 100%.
          </p>
          <p className="text-muted">
            Book status updates automatically: <em>To read</em> → <em>Reading</em> when you log
            pages → <em>Finished</em> when you reach the last page.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Cards in a book</h3>
          <p className="text-muted">
            Some catalog books list collectible cards you can find in that title — characters,
            locations, units, and events tied to the story. Tap a card on the book page to preview it. Locked
            cards can be unlocked later with points in your collection.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Linking people</h3>
          <p className="text-muted">
            While reading, you can link historical people from your timeline to a book — a handy way
            to remember who you encountered in each title.
          </p>
        </div>
      </GuideSection>

      <GuideSection id="points" title="Points & milestones" icon={Sparkles}>
        <p>
          Points are the currency of HistoryCodex. You earn them by reading, and spend them to grow
          your collection.
        </p>

        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/60">
                <th className="px-4 py-2.5 font-medium text-foreground/80">Milestone</th>
                <th className="px-4 py-2.5 font-medium text-foreground/80">Reward</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/80">
              {[
                ["25% of a book", "25 points"],
                ["50% of a book", "25 points"],
                ["75% of a book", "25 points"],
                ["100% of a book", "25 points"],
              ].map(([milestone, reward]) => (
                <tr key={milestone}>
                  <td className="px-4 py-2.5 text-muted">{milestone}</td>
                  <td className="px-4 py-2.5 font-medium text-gold-bright">{reward}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          That is up to <strong className="text-foreground">100 points per book</strong> if you
          finish it. Milestones are awarded once per book — you cannot farm the same title repeatedly.
        </p>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">Two kinds of points</h3>
          <ul className="space-y-2">
            <li className="rounded-lg border border-border/80 bg-background/50 px-4 py-3">
              <p className="font-medium text-foreground">Global balance</p>
              <p className="mt-0.5 text-muted">
                Shown in the navigation bar. Used to unlock individual cards in the Collection — each
                card has a point cost based on its rarity.
              </p>
            </li>
            <li className="rounded-lg border border-border/80 bg-background/50 px-4 py-3">
              <p className="font-medium text-foreground">Era points</p>
              <p className="mt-0.5 text-muted">
                Earned alongside global points when reading books tagged to an era. Spent on era-themed{" "}
                <InlineLink href="/packs">booster packs</InlineLink> on the Dashboard or Packs page.
              </p>
            </li>
          </ul>
        </div>

        <Tip>
          Daily and weekly point caps still apply — if you hit the limit, extra milestone points wait until
          the cap resets.
        </Tip>
      </GuideSection>

      <GuideSection id="cards" title="Collectible cards" icon={Users2}>
        <p>
          Your <InlineLink href="/collection">Collection</InlineLink> holds every card you have
          unlocked. Cards come in three types:
        </p>
        <ul className="grid gap-2 sm:grid-cols-3">
          {[
            { type: "Characters", desc: "Historical figures with battle stats" },
            { type: "Locations", desc: "Places with era buffs" },
            { type: "Units", desc: "Armies, roles, and groups" },
          ].map((item) => (
            <li
              key={item.type}
              className="rounded-lg border border-border/80 bg-background/50 px-3 py-2.5"
            >
              <p className="text-sm font-medium text-foreground">{item.type}</p>
              <p className="mt-0.5 text-xs text-muted">{item.desc}</p>
            </li>
          ))}
        </ul>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">Rarity tiers</h3>
          <p className="text-muted">
            Cards range from Common to Mythic. Rarer cards cost more points to unlock and have
            stronger stats. The star rating on each card reflects its rarity.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">Unlocking cards</h3>
          <p className="text-muted">
            Tap a locked card in your collection and spend points to add it to your codex. You can
            also pull random cards from booster packs. Cards linked to books you are reading give you
            a preview of what is waiting to be discovered.
          </p>
        </div>
      </GuideSection>

      <GuideSection id="campaigns" title="Campaigns" icon={Map}>
        <p>
          Each era has a <InlineLink href="/campaigns">campaign map</InlineLink> — a visual path
          that tracks your reading journey through that period.
        </p>
        <p>
          As you hit reading milestones (25%, 50%, 75%, 100%) on books tagged to an era, nodes on
          that era&apos;s map unlock automatically. Finish a book and you reach the final node.
        </p>
        <p className="text-muted">
          Campaigns do not cost points. They are a record of how far you have read within each
          historical era — separate from your card collection, but driven by the same reading
          progress.
        </p>
      </GuideSection>

      <GuideSection id="packs" title="Booster packs" icon={Gift}>
        <p>
          Visit <InlineLink href="/packs">Packs</InlineLink> to spend era points on booster packs.
          Each pack is themed to a specific era and may focus on characters, locations, units, or events.
        </p>
        <ul className="list-inside list-disc space-y-1.5 text-muted">
          <li>Packs draw random cards weighted by rarity</li>
          <li>You need enough era points for the pack&apos;s price</li>
          <li>Duplicates are skipped — you only collect each card once</li>
        </ul>
        <Tip>
          Prefer a specific card? Check if it is linked to a book you are reading, then unlock it
          directly in the Collection instead of relying on a random pull.
        </Tip>
      </GuideSection>

      <footer className="rounded-xl border border-border bg-surface/40 p-5 text-center">
        <p className="text-sm text-muted">
          Ready to begin? Head to your{" "}
          <InlineLink href="/dashboard">Dashboard</InlineLink> or{" "}
          <InlineLink href="/books/browse">browse the catalog</InlineLink>.
        </p>
      </footer>
    </div>
  );
}
