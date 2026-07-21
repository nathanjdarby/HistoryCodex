"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const FULL_BLEED_PATHS = new Set(["/", "/about", "/login", "/dashboard"]);

export function MainShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const fullBleed = FULL_BLEED_PATHS.has(pathname);

  return (
    <main
      className={
        fullBleed
          ? "mx-auto w-full flex-1"
          : "mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8"
      }
    >
      {children}
    </main>
  );
}
