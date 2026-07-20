"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Coins,
  Gift,
  Layers,
  Sparkles,
  Trophy,
  User,
  Users2,
} from "lucide-react";
import { PageHeader, PageSection } from "@/components/page-header";
import { ProfileIdentityForm } from "@/components/profile-identity-form";
import type { Character, Era, UserStats } from "@/lib/types";

type AuthUser = {
  id: number;
  email: string;
  role: "user" | "admin";
  displayName?: string;
};

type EraBalance = {
  eraId: number;
  eraName: string;
  eraSlug: string;
  colorPrimary: string;
  pointsBalance: number;
  totalPointsEarned: number;
};

type ProfileStats = UserStats & { eraBalances?: EraBalance[] };

type CharacterWithEra = Character & { era: Era; owned: boolean };

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  return res.json();
}

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Sparkles;
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="app-card-tile p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <Icon size={14} />
        {label}
      </div>
      <p className="mt-1.5 text-2xl font-semibold text-foreground">{value.toLocaleString()}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export default function ProfilePage() {
  const { data: auth } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => fetchJson<{ user: AuthUser | null }>("/api/auth/me"),
  });
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => fetchJson<ProfileStats>("/api/stats"),
  });
  const { data: characters } = useQuery({
    queryKey: ["characters"],
    queryFn: () => fetchJson<CharacterWithEra[]>("/api/characters"),
  });

  const user = auth?.user;
  const ownedCount = characters?.filter((c) => c.owned).length ?? 0;
  const eraBalances = stats?.eraBalances ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Player profile"
        title={user?.displayName ?? user?.email ?? "Your profile"}
        description={
          user?.displayName && user.displayName !== user.email
            ? `${user.email} — points, era balances, and codex progress.`
            : "Points you've earned from reading, era balances for booster packs, and your codex progress."
        }
        icon={User}
        actions={
          <Link href="/packs" className="app-btn-primary">
            <Gift size={16} />
            Open packs
          </Link>
        }
      />

      <PageSection title="About you" description="Set how you'd like to be addressed across HistoryCodex.">
        <ProfileIdentityForm />
      </PageSection>

      <PageSection title="General points">
        {statsLoading ? (
          <p className="text-sm text-muted">Loading points…</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-2">
            <StatTile
              icon={Sparkles}
              label="Points balance"
              value={stats?.pointsBalance ?? 0}
              hint="Spend on any booster pack in the shop"
            />
            <StatTile
              icon={Trophy}
              label="Total earned"
              value={stats?.totalPointsEarned ?? 0}
              hint="All-time points from reading milestones"
            />
          </div>
        )}
      </PageSection>

      <PageSection
        title="Era points"
        description="Era points unlock era-specific booster packs. Earn them by reading books tagged to that period."
        action={
          <Link href="/packs" className="app-link text-xs">
            Browse packs
          </Link>
        }
      >
        {eraBalances.length === 0 ? (
          <div className="app-empty text-sm">
            <p>No era points yet.</p>
            <p className="mt-1">
              Add timelines and read books from an era to start earning era-specific points.
            </p>
            <Link href="/profile/timelines" className="app-link mt-3 inline-flex items-center gap-1">
              <Layers size={14} />
              Choose my timelines
            </Link>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {eraBalances.map((era) => (
              <Link
                key={era.eraId}
                href={`/campaigns/${era.eraSlug}`}
                className="app-card-tile flex items-center justify-between gap-3 p-3"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full ring-1 ring-white/10"
                    style={{ background: era.colorPrimary }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{era.eraName}</p>
                    <p className="text-xs text-muted">
                      {era.totalPointsEarned.toLocaleString()} earned all time
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 text-gold-bright">
                  <Coins size={14} />
                  <span className="text-lg font-semibold">{era.pointsBalance.toLocaleString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </PageSection>

      <PageSection title="Codex progress">
        <div className="grid grid-cols-2 gap-3">
          <StatTile
            icon={BookOpen}
            label="Books finished"
            value={stats?.booksFinished ?? 0}
            hint="Completed reads in your library"
          />
          <StatTile
            icon={Users2}
            label="Characters unlocked"
            value={ownedCount}
            hint="Unique cards in your collection"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/books" className="app-btn-secondary text-sm">
            My books
          </Link>
          <Link href="/collection" className="app-btn-secondary text-sm">
            Collection
          </Link>
          <Link href="/profile/timelines" className="app-btn-secondary text-sm">
            <Layers size={14} />
            My timelines
          </Link>
        </div>
      </PageSection>
    </div>
  );
}
