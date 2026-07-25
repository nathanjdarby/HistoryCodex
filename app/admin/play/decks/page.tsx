"use client";

import DeckBuilderPage from "@/app/play/decks/page";
import { PlayBasePathProvider } from "@/lib/play/base-path-context";

export default function AdminDeckBuilderPage() {
  return (
    <PlayBasePathProvider basePath="/admin/play">
      <DeckBuilderPage />
    </PlayBasePathProvider>
  );
}
