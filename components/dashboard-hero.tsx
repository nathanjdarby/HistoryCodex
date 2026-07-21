import Image from "next/image";
import Link from "next/link";
import { Landmark } from "lucide-react";

export function DashboardHero({ firstName }: { firstName?: string | null }) {
  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative aspect-[21/9] w-full max-h-[26rem] sm:max-h-[30rem] md:max-h-[36rem]">
        <Image
          src="/images/dashboard-hero-banner.jpg"
          alt="History Codex — Step through the portal and explore history"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_30%]"
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-background via-background/90 to-transparent"
      />
      <div className="absolute inset-x-0 bottom-0 px-4 pb-10 pt-24 sm:px-6 sm:pb-12">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="app-page-eyebrow">Your codex</p>
            <div className="mt-0.5 flex items-start gap-2">
              <span className="app-page-icon mt-0.5 shrink-0">
                <Landmark size={18} />
              </span>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
                </h1>
                <p className="mt-0.5 line-clamp-1 text-sm text-muted sm:line-clamp-none">
                  Pick up where you left off — continue reading, log history, and grow your collection.
                </p>
              </div>
            </div>
          </div>
          <Link href="/profile" className="app-btn-secondary shrink-0 text-sm">
            View profile
          </Link>
        </div>
      </div>
    </section>
  );
}
