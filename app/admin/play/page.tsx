"use client";

import PlayPage from "@/app/play/page";
import { PlayBasePathProvider } from "@/lib/play/base-path-context";

export default function AdminPlayPage() {
  return (
    <PlayBasePathProvider basePath="/admin/play">
      <PlayPage />
    </PlayBasePathProvider>
  );
}
