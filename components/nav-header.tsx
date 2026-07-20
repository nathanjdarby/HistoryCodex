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
  User,
  Sun,
  Moon,
  PanelTopClose,
} from "lucide-react";
import { useNavChrome } from "@/lib/client/nav-chrome";
import { useTheme } from "@/lib/client/theme";

type Stats = {
  pointsBalance: number;
};

type AuthUser = {
  id: number;
  email: string;
  role: "user" | "admin";
  displayName?: string;
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

/** Primary app nav — kept minimal; profile/about live in the user menu. */
const userNav: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Landmark },
  { href: "/books", label: "Books", icon: BookOpen },
  {
    label: "Timeline",
    icon: ScrollText,
    items: [
      { href: "/timeline", label: "Timeline", icon: ScrollText },
      { href: "/campaigns", label: "Campaigns", icon: Map },
      { href: "/profile/timelines", label: "My timelines", icon: Layers },
    ],
  },
  {
    label: "Codex",
    icon: LayoutGrid,
    items: [
      { href: "/collection", label: "Collection", icon: Users2 },
      { href: "/packs", label: "Packs", icon: Gift },
      { href: "/play", label: "Play", icon: Swords, dividerBefore: true },
      { href: "/play/decks", label: "Decks", icon: Plus },
    ],
  },
];

function isNavLink(item: NavItem): item is NavLink {
  return "href" in item;
}

function isPathActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
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

function isUserMenuActive(pathname: string) {
  return pathname === "/profile" || pathname.startsWith("/profile/") || pathname === "/about";
}

function navLinkClass(active: boolean) {
  return `flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors lg:gap-1.5 lg:px-2.5 lg:py-1.5 lg:text-sm ${
    active
      ? "bg-accent/15 text-gold-bright"
      : "text-muted hover:bg-accent/10 hover:text-foreground"
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
            className="fixed z-[200] min-w-[11rem] rounded-lg border border-border bg-background py-1 shadow-2xl ring-1 ring-black/10 dark:ring-black/20"
          >
            {group.items.map((item) => {
              const itemActive = isPathActive(pathname, item.href);
              return (
                <div key={item.href}>
                  {item.dividerBefore ? (
                    <div className="my-1 border-t border-border" role="separator" />
                  ) : null}
                  <Link
                    href={item.href}
                    role="menuitem"
                    onClick={onClose}
                    className={`flex items-center gap-2 px-3 py-2 text-sm ${
                      itemActive
                        ? "bg-accent/15 text-foreground"
                        : "text-foreground/90 hover:bg-surface-hover hover:text-foreground"
                    }`}
                  >
                    <item.icon size={14} />
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
        <group.icon size={14} className="lg:h-[15px] lg:w-[15px]" />
        <span>{group.label}</span>
        <ChevronDown size={12} className={`opacity-60 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {menu}
    </>
  );
}

function UserMenu({
  user,
  pointsBalance,
  open,
  onToggle,
  onClose,
  onLogout,
  pathname,
}: {
  user: AuthUser;
  pointsBalance: number;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onLogout: () => void;
  pathname: string;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<{ top: number; right: number } | null>(null);
  const { theme, toggleTheme } = useTheme();
  const { hideNav } = useNavChrome();
  const active = isUserMenuActive(pathname);
  const initial = (user.displayName ?? user.email).charAt(0).toUpperCase();

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setMenuStyle(null);
      return;
    }

    function updatePosition() {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuStyle({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
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
            style={{ top: menuStyle.top, right: menuStyle.right }}
            className="fixed z-[200] w-56 rounded-lg border border-border bg-background py-1 shadow-2xl ring-1 ring-black/10 dark:ring-black/20"
          >
            <div className="border-b border-border px-3 py-2.5">
              <p className="truncate text-sm font-medium text-foreground">
                {user.displayName ?? user.email}
              </p>
              {user.displayName && user.displayName !== user.email ? (
                <p className="truncate text-xs text-muted">{user.email}</p>
              ) : null}
              <Link
                href="/profile"
                role="menuitem"
                onClick={onClose}
                className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-gold-bright hover:underline"
              >
                <Sparkles size={12} />
                {pointsBalance.toLocaleString()} points
              </Link>
            </div>

            <Link
              href="/profile"
              role="menuitem"
              onClick={onClose}
              className={`flex items-center gap-2 px-3 py-2 text-sm ${
                pathname === "/profile"
                  ? "bg-accent/15 text-foreground"
                  : "text-foreground/90 hover:bg-surface-hover"
              }`}
            >
              <User size={14} />
              Profile
            </Link>
            <Link
              href="/about"
              role="menuitem"
              onClick={onClose}
              className={`flex items-center gap-2 px-3 py-2 text-sm ${
                pathname === "/about"
                  ? "bg-accent/15 text-foreground"
                  : "text-foreground/90 hover:bg-surface-hover"
              }`}
            >
              <Info size={14} />
              About
            </Link>

            <div className="my-1 border-t border-border" role="separator" />

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                toggleTheme();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground/90 hover:bg-surface-hover"
            >
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                hideNav();
                onClose();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground/90 hover:bg-surface-hover"
            >
              <PanelTopClose size={14} />
              Hide navigation
            </button>

            <div className="my-1 border-t border-border" role="separator" />

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted hover:bg-surface-hover hover:text-foreground"
            >
              <LogOut size={14} />
              Sign out
            </button>
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
        aria-label="Account menu"
        title={user.displayName ?? user.email}
        className={`flex shrink-0 items-center gap-1 rounded-md py-1 pl-1 pr-1.5 text-xs transition-colors lg:pr-2 ${
          active || open
            ? "bg-accent/15 text-gold-bright"
            : "text-muted hover:bg-accent/10 hover:text-foreground"
        }`}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-accent-border bg-accent/10 text-[11px] font-semibold text-gold-bright">
          {initial}
        </span>
        <ChevronDown size={12} className={`opacity-60 transition-transform ${open ? "rotate-180" : ""}`} />
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { navHidden } = useNavChrome();

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
    enabled: Boolean(user) && !isAdmin && pathname !== "/login",
  });

  useEffect(() => {
    setOpenMenu(null);
    setUserMenuOpen(false);
  }, [pathname]);

  if (pathname === "/login" || navHidden) return null;

  const isGuestMarketing = !user && (pathname === "/" || pathname === "/about");

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    queryClient.clear();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-accent-border bg-background/92 backdrop-blur">
      <div className="mx-auto flex h-full max-w-6xl flex-nowrap items-center gap-2 px-3 sm:px-6">
        <Link
          href={isAdmin ? "/admin" : user ? "/dashboard" : "/"}
          className="flex shrink-0 items-center gap-1.5 font-semibold tracking-tight text-foreground"
          title="HistoryCodex"
        >
          <span className="text-base leading-none">📜</span>
          <span className="hidden text-sm sm:inline">{isAdmin ? "Admin" : "Codex"}</span>
        </Link>

        {isGuestMarketing ? (
          <>
            <div className="min-w-0 flex-1" />
            <nav className="flex shrink-0 flex-nowrap items-center gap-0.5">
              {pathname !== "/" && (
                <Link href="/" className={navLinkClass(false)}>
                  Home
                </Link>
              )}
              <Link href="/about" className={navLinkClass(pathname === "/about")}>
                About
              </Link>
            </nav>
          </>
        ) : !isAdmin ? (
          <nav className="flex min-w-0 flex-1 flex-nowrap items-center justify-center gap-0.5 lg:gap-1">
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
                    <item.icon size={14} className="lg:h-[15px] lg:w-[15px]" />
                    <span>{item.label}</span>
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
        ) : (
          <div className="min-w-0 flex-1" />
        )}

        <div className="flex shrink-0 flex-nowrap items-center gap-1">
          {user ? (
            <UserMenu
              user={user}
              pointsBalance={stats?.pointsBalance ?? 0}
              open={userMenuOpen}
              onToggle={() => {
                setUserMenuOpen((open) => !open);
                setOpenMenu(null);
              }}
              onClose={() => setUserMenuOpen(false)}
              onLogout={logout}
              pathname={pathname}
            />
          ) : isGuestMarketing ? (
            <>
              <GuestThemeToggle />
              <Link href="/login" className="app-btn-primary px-2.5 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm">
                Sign in
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}

/** Theme toggle for guests only — logged-in users use the account menu. */
function GuestThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-md p-1.5 text-muted hover:bg-surface-hover hover:text-foreground"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
