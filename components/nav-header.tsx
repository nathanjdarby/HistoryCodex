"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  BookOpen,
  ScrollText,
  Users2,
  Landmark,
  Gift,
  Layers,
  LogOut,
  ChevronDown,
  LayoutGrid,
  Map,
  Info,
  Plus,
  Swords,
} from "lucide-react";

type Stats = {
  pointsBalance: number;
};

type AuthUser = {
  id: number;
  email: string;
  role: "user" | "admin";
};

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  dividerBefore?: boolean;
};

type NavGroup = {
  label: string;
  icon: LucideIcon;
  items: NavLink[];
};

type NavItem = NavLink | NavGroup;

const userNav: NavItem[] = [
  { href: "/", label: "Dashboard", icon: Landmark },
  {
    label: "Timeline",
    icon: ScrollText,
    items: [
      { href: "/timeline", label: "Timeline", icon: ScrollText },
      { href: "/profile/timelines", label: "My timelines", icon: Layers },
      { href: "/campaigns", label: "Campaigns", icon: Map },
    ],
  },
  { href: "/books", label: "Books", icon: BookOpen },
  {
    label: "Cards",
    icon: LayoutGrid,
    items: [
      { href: "/collection", label: "Collection", icon: Users2 },
      { href: "/packs", label: "Packs", icon: Gift },
      { href: "/play", label: "Play", icon: Swords, dividerBefore: true },
      { href: "/play/decks", label: "Decks", icon: Plus },
    ],
  },
  { href: "/about", label: "About", icon: Info },
];

function isNavLink(item: NavItem): item is NavLink {
  return "href" in item;
}

function isPathActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (pathname === href) return true;
  if (href === "/play") {
    return pathname.startsWith("/play/matches");
  }
  return pathname.startsWith(`${href}/`);
}

function isGroupActive(pathname: string, group: NavGroup) {
  return group.items.some((item) => isPathActive(pathname, item.href));
}

function navLinkClass(active: boolean) {
  return `flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors sm:px-3 ${
    active
      ? "bg-amber-900/40 text-amber-200"
      : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
  }`;
}

function NavDropdown({
  group,
  pathname,
  open,
  onToggle,
  onClose,
}: {
  group: NavGroup;
  pathname: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number } | null>(null);
  const active = isGroupActive(pathname, group);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setMenuStyle(null);
      return;
    }

    function updatePosition() {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuStyle({ top: rect.bottom + 6, left: rect.left });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      onClose();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const menu =
    open && menuStyle
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ top: menuStyle.top, left: menuStyle.left }}
            className="fixed z-[200] min-w-[12rem] rounded-lg border border-neutral-700 bg-neutral-950 py-1 shadow-2xl ring-1 ring-black/20"
          >
            {group.items.map((item) => {
              const itemActive = isPathActive(pathname, item.href);
              return (
                <div key={item.href}>
                  {item.dividerBefore ? (
                    <div className="my-1 border-t border-neutral-800" role="separator" />
                  ) : null}
                  <Link
                    href={item.href}
                    role="menuitem"
                    onClick={onClose}
                    className={`flex items-center gap-2 px-3 py-2.5 text-sm ${
                      itemActive
                        ? "bg-amber-900/40 text-amber-100"
                        : "text-neutral-200 hover:bg-neutral-900 hover:text-white"
                    }`}
                  >
                    <item.icon size={15} />
                    {item.label}
                  </Link>
                </div>
              );
            })}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="menu"
        title={group.label}
        className={navLinkClass(active || open)}
      >
        <group.icon size={15} />
        <span className="hidden sm:inline">{group.label}</span>
        <ChevronDown
          size={14}
          className={`hidden sm:inline transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {menu}
    </>
  );
}

export function NavHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const { data: auth } = useQuery<{ user: AuthUser | null }>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Failed to load session");
      return res.json();
    },
    enabled: pathname !== "/login",
  });

  const user = auth?.user;
  const isAdmin = user?.role === "admin";

  const { data: stats } = useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error("Failed to load stats");
      return res.json();
    },
    enabled: pathname !== "/login" && !isAdmin,
  });

  useEffect(() => {
    setOpenMenu(null);
  }, [pathname]);

  if (pathname === "/login") return null;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    queryClient.clear();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur">
      <div className="mx-auto flex h-full max-w-6xl items-center gap-2 px-3 sm:px-4">
        <Link
          href={isAdmin ? "/admin" : "/"}
          className="flex shrink-0 items-center gap-1.5 font-semibold tracking-tight text-amber-100"
        >
          <span className="text-lg">📜</span>
          <span className="hidden sm:inline">{isAdmin ? "HistoryCodex Admin" : "HistoryCodex"}</span>
        </Link>

        {!isAdmin && (
          <nav className="flex min-w-0 flex-1 flex-wrap items-center gap-0.5 sm:gap-1">
            {userNav.map((item) => {
              if (isNavLink(item)) {
                const active = isPathActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    className={navLinkClass(active)}
                  >
                    <item.icon size={15} />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              }

              return (
                <NavDropdown
                  key={item.label}
                  group={item}
                  pathname={pathname}
                  open={openMenu === item.label}
                  onToggle={() =>
                    setOpenMenu((current) => (current === item.label ? null : item.label))
                  }
                  onClose={() => setOpenMenu(null)}
                />
              );
            })}
          </nav>
        )}

        {isAdmin && <div className="flex-1" />}

        <div className="flex shrink-0 items-center gap-2">
          {!isAdmin && (
            <div className="flex items-center gap-1.5 rounded-full border border-amber-800/50 bg-amber-950/40 px-2.5 py-1 text-sm font-medium text-amber-200 sm:px-3">
              <Sparkles size={14} />
              {stats?.pointsBalance ?? 0}
              <span className="hidden sm:inline">pts</span>
            </div>
          )}
          {user && (
            <>
              <span
                className="hidden max-w-[10rem] truncate text-xs text-neutral-500 sm:inline"
                title={user.email}
              >
                {user.email}
              </span>
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
                title="Sign out"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
