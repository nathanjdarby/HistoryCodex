"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  ChevronDown,
  Flag,
  Gift,
  IdCard,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  MapPin,
  ShieldAlert,
  Sparkles,
  Scale,
  Swords,
  UserCog,
  Users2,
  BookOpen,
  Zap,
} from "lucide-react";

type NavLinkItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: "verification";
};

const mainLinks: NavLinkItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: UserCog },
  { href: "/admin/verification", label: "Verification", icon: ShieldAlert, badgeKey: "verification" },
  { href: "/admin/rules", label: "Rules", icon: Scale },
  { href: "/admin/books", label: "Books", icon: BookOpen },
];

const cardLinks: NavLinkItem[] = [
  { href: "/admin/dex", label: "DEX", icon: Layers },
  { href: "/admin/characters", label: "Characters", icon: Users2 },
  { href: "/admin/units", label: "Units", icon: Flag },
  { href: "/admin/locations", label: "Locations", icon: MapPin },
  { href: "/admin/events", label: "Events", icon: Swords },
  { href: "/admin/abilities", label: "Abilities", icon: Zap },
  { href: "/admin/packs", label: "Packs", icon: Gift },
];

const trailingLinks: NavLinkItem[] = [
  { href: "/admin/eras", label: "Eras", icon: Sparkles },
  { href: "/admin/artwork", label: "Artwork", icon: ImageIcon },
];

async function fetchVerificationCount(): Promise<number> {
  const res = await fetch("/api/admin/verification?countOnly=1");
  if (!res.ok) return 0;
  const data = await res.json();
  return data.pendingCount ?? 0;
}

function isNavActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function AdminNavLink({
  href,
  label,
  icon: Icon,
  badge = 0,
  pathname,
}: NavLinkItem & { badge?: number; pathname: string }) {
  const active = isNavActive(pathname, href);

  return (
    <Link
      href={href}
      className={`relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
        active
          ? "bg-neutral-800 text-neutral-100"
          : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
      }`}
    >
      <Icon size={14} />
      {label}
      {badge > 0 && (
        <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-600 px-1 text-[10px] font-semibold text-amber-50">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

function CardsNavDropdown({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsNavActive = cardLinks.some((link) => isNavActive(pathname, link.href));
  const activeLink = cardLinks.find((link) => isNavActive(pathname, link.href));

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
          cardsNavActive || open
            ? "bg-neutral-800 text-neutral-100"
            : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
        }`}
      >
        <IdCard size={14} />
        Cards
        {activeLink ? (
          <span className="hidden text-neutral-500 sm:inline">· {activeLink.label}</span>
        ) : null}
        <ChevronDown
          size={14}
          className={`text-neutral-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-1 min-w-[11rem] overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 py-1 shadow-xl"
        >
          {cardLinks.map(({ href, label, icon: Icon }) => {
            const active = isNavActive(pathname, href);
                const showDivider = href === "/admin/packs";
            return (
              <div key={href}>
                {showDivider ? <div className="my-1 border-t border-neutral-800" role="separator" /> : null}
                <Link
                  href={href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-neutral-800 text-neutral-100"
                      : "text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100"
                  }`}
                >
                  <Icon size={14} className={active ? "text-amber-400" : "text-neutral-500"} />
                  {label}
                </Link>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["admin-verification-count"],
    queryFn: fetchVerificationCount,
    refetchInterval: 60_000,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
        <nav className="flex flex-wrap items-center gap-1">
          {mainLinks.map((link) => (
            <AdminNavLink
              key={link.href}
              {...link}
              pathname={pathname}
              badge={link.badgeKey === "verification" ? pendingCount : 0}
            />
          ))}

          <CardsNavDropdown pathname={pathname} />

          {trailingLinks.map((link) => (
            <AdminNavLink key={link.href} {...link} pathname={pathname} />
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
