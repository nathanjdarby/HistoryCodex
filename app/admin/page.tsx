"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Flag, Gift, Image as ImageIcon, MapPin, ShieldAlert, Swords, UserCog, Users2 } from "lucide-react";
import type { Character } from "@/lib/types";

type PackConfig = { id: number; active: boolean };
type ArtworkFile = { filename: string; usedBy: { id: number; name: string }[] };
type ArtworkResponse = { files: ArtworkFile[]; unusedCount: number };
type AdminUser = { id: number };

async function fetchUsers(): Promise<AdminUser[]> {
  const res = await fetch("/api/admin/users");
  if (!res.ok) throw new Error("Failed to load users");
  return res.json();
}

async function fetchCharacters(): Promise<Character[]> {
  const res = await fetch("/api/characters");
  if (!res.ok) throw new Error("Failed to load characters");
  return res.json();
}

async function fetchPackConfigs(): Promise<PackConfig[]> {
  const res = await fetch("/api/pack-configs");
  if (!res.ok) throw new Error("Failed to load pack configs");
  return res.json();
}

async function fetchArtwork(): Promise<ArtworkResponse> {
  const res = await fetch("/api/admin/artwork");
  if (!res.ok) throw new Error("Failed to load artwork");
  return res.json();
}

export default function AdminOverviewPage() {
  const { data: characters } = useQuery({ queryKey: ["characters"], queryFn: fetchCharacters });
  const { data: packConfigs } = useQuery({ queryKey: ["pack-configs"], queryFn: fetchPackConfigs });
  const { data: artwork } = useQuery({
    queryKey: ["admin-artwork"],
    queryFn: fetchArtwork,
    retry: false,
  });
  const { data: adminUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchUsers,
  });

  const characterCount = characters?.filter((c) => c.cardType === "character").length ?? 0;
  const unitCount = characters?.filter((c) => c.cardType === "unit").length ?? 0;
  const locationCount = characters?.filter((c) => c.cardType === "location").length ?? 0;
  const eventCount = characters?.filter((c) => c.cardType === "event").length ?? 0;
  const characterCustomArt =
    characters?.filter((c) => c.cardType === "character" && c.imageUrl).length ?? 0;
  const unitCustomArt = characters?.filter((c) => c.cardType === "unit" && c.imageUrl).length ?? 0;
  const locationCustomArt =
    characters?.filter((c) => c.cardType === "location" && c.imageUrl).length ?? 0;
  const eventCustomArt = characters?.filter((c) => c.cardType === "event" && c.imageUrl).length ?? 0;
  const activePacks = packConfigs?.filter((p) => p.active).length ?? 0;
  const inactivePacks = (packConfigs?.length ?? 0) - activePacks;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-100">Admin</h1>
        <p className="text-sm text-neutral-500">
          Manage users, books, cards, booster packs, and uploaded artwork.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/users"
          className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 hover:border-neutral-700"
        >
          <div className="flex items-center gap-2 text-neutral-400">
            <UserCog size={16} />
            <span className="text-sm">Users</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-neutral-100">
            {adminUsers?.length ?? "—"}
          </p>
          <p className="mt-1 text-xs text-neutral-500">accounts & player progress</p>
        </Link>

        <Link
          href="/admin/verification"
          className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 hover:border-neutral-700"
        >
          <div className="flex items-center gap-2 text-neutral-400">
            <ShieldAlert size={16} />
            <span className="text-sm">Verification</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-neutral-100">Queue</p>
          <p className="mt-1 text-xs text-neutral-500">review flagged reading sessions</p>
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Cards</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/characters"
          className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 hover:border-neutral-700"
        >
          <div className="flex items-center gap-2 text-neutral-400">
            <Users2 size={16} />
            <span className="text-sm">Characters</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-neutral-100">
            {characterCount || "—"}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {characterCustomArt} with custom art
          </p>
        </Link>

        <Link
          href="/admin/units"
          className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 hover:border-neutral-700"
        >
          <div className="flex items-center gap-2 text-neutral-400">
            <Flag size={16} />
            <span className="text-sm">Units</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-neutral-100">{unitCount || "—"}</p>
          <p className="mt-1 text-xs text-neutral-500">{unitCustomArt} with custom art</p>
        </Link>

        <Link
          href="/admin/locations"
          className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 hover:border-neutral-700"
        >
          <div className="flex items-center gap-2 text-neutral-400">
            <MapPin size={16} />
            <span className="text-sm">Locations</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-neutral-100">
            {locationCount || "—"}
          </p>
          <p className="mt-1 text-xs text-neutral-500">{locationCustomArt} with custom art</p>
        </Link>

        <Link
          href="/admin/events"
          className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 hover:border-neutral-700"
        >
          <div className="flex items-center gap-2 text-neutral-400">
            <Swords size={16} />
            <span className="text-sm">Events</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-neutral-100">{eventCount || "—"}</p>
          <p className="mt-1 text-xs text-neutral-500">{eventCustomArt} with custom art</p>
        </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/packs"
          className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 hover:border-neutral-700"
        >
          <div className="flex items-center gap-2 text-neutral-400">
            <Gift size={16} />
            <span className="text-sm">Booster Packs</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-neutral-100">
            {packConfigs?.length ?? "—"}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {activePacks} active · {inactivePacks} inactive
          </p>
        </Link>

        <Link
          href="/admin/artwork"
          className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 hover:border-neutral-700"
        >
          <div className="flex items-center gap-2 text-neutral-400">
            <ImageIcon size={16} />
            <span className="text-sm">Artwork</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-neutral-100">
            {artwork?.files.length ?? "—"}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {artwork ? `${artwork.unusedCount} unused` : "uploaded files"}
          </p>
        </Link>
      </div>
    </div>
  );
}
