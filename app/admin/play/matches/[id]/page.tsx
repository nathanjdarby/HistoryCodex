"use client";

import MatchPage from "@/app/play/matches/[id]/page";
import { PlayBasePathProvider } from "@/lib/play/base-path-context";

export default function AdminMatchPage() {
  return (
    <PlayBasePathProvider basePath="/admin/play">
      <MatchPage />
    </PlayBasePathProvider>
  );
}
