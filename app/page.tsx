import type { Metadata } from "next";
import { HomeLanding } from "@/components/home-landing";
import { listFeaturedCharacters } from "@/lib/server/characters";
import { listCatalogBooks } from "@/lib/server/catalog-books";

export const metadata: Metadata = {
  title: "HistoryCodex — Unlock the magical history of the world",
  description:
    "Read history books, collect characters and places from the past, and battle through the ages. Your personal codex awaits.",
};

export default async function HomePage() {
  const [featuredCards, catalog] = await Promise.all([
    listFeaturedCharacters(6),
    listCatalogBooks({ activeOnly: true }),
  ]);

  return (
    <HomeLanding
      featuredCards={featuredCards}
      featuredBooks={catalog.slice(0, 5)}
      catalogBookCount={catalog.length}
    />
  );
}
