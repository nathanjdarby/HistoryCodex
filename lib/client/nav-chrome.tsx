"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { Menu, PanelTopClose } from "lucide-react";
import { isBrowserFullscreen } from "@/lib/client/use-browser-fullscreen";

const STORAGE_KEY = "historycodex-nav-preference";

export type NavChromePreference = "auto" | "hidden" | "visible";

type NavChromeContextValue = {
  preference: NavChromePreference;
  isBrowserFullscreen: boolean;
  navHidden: boolean;
  hideNav: () => void;
  showNav: () => void;
  resetNavPreference: () => void;
};

const NavChromeContext = createContext<NavChromeContextValue | null>(null);

function readStoredPreference(): NavChromePreference {
  if (typeof window === "undefined") return "auto";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "hidden" || stored === "visible") return stored;
  return "auto";
}

function resolveNavHidden(preference: NavChromePreference, fullscreen: boolean) {
  if (preference === "hidden") return true;
  if (preference === "visible") return false;
  return fullscreen;
}

export function NavChromeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<NavChromePreference>("auto");
  const [fullscreen, setFullscreen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPreference(readStoredPreference());
    setHydrated(true);
  }, []);

  useEffect(() => {
    function syncFullscreen() {
      setFullscreen(isBrowserFullscreen());
    }

    syncFullscreen();
    document.addEventListener("fullscreenchange", syncFullscreen);
    document.addEventListener("webkitfullscreenchange", syncFullscreen);
    window.addEventListener("resize", syncFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      document.removeEventListener("webkitfullscreenchange", syncFullscreen);
      window.removeEventListener("resize", syncFullscreen);
    };
  }, []);

  const navHidden = hydrated ? resolveNavHidden(preference, fullscreen) : false;

  useEffect(() => {
    document.documentElement.dataset.navHidden = navHidden ? "true" : "false";
    document.documentElement.dataset.browserFullscreen = fullscreen ? "true" : "false";
    return () => {
      delete document.documentElement.dataset.navHidden;
      delete document.documentElement.dataset.browserFullscreen;
    };
  }, [navHidden, fullscreen]);

  const persist = useCallback((next: NavChromePreference) => {
    setPreference(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo<NavChromeContextValue>(
    () => ({
      preference,
      isBrowserFullscreen: fullscreen,
      navHidden,
      hideNav: () => persist("hidden"),
      showNav: () => persist("visible"),
      resetNavPreference: () => persist("auto"),
    }),
    [preference, fullscreen, navHidden, persist],
  );

  return (
    <NavChromeContext.Provider value={value}>
      {children}
      <NavChromeRestoreButton />
    </NavChromeContext.Provider>
  );
}

export function useNavChrome() {
  const context = useContext(NavChromeContext);
  if (!context) {
    throw new Error("useNavChrome must be used within NavChromeProvider");
  }
  return context;
}

function NavChromeRestoreButton() {
  const pathname = usePathname();
  const { navHidden, showNav } = useNavChrome();

  if (pathname === "/login" || !navHidden) return null;

  return (
    <button
      type="button"
      onClick={showNav}
      className="fixed left-3 top-3 z-50 flex items-center gap-1.5 rounded-full border border-accent-border bg-background/90 px-2.5 py-1.5 text-[11px] font-medium text-foreground/80 shadow-lg backdrop-blur hover:border-accent/50 hover:text-foreground"
      title="Show navigation"
      aria-label="Show navigation"
    >
      <Menu size={14} />
      <span className="hidden sm:inline">Show nav</span>
    </button>
  );
}

export function NavChromeHideButton() {
  const { hideNav } = useNavChrome();

  return (
    <button
      type="button"
      onClick={hideNav}
      className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted hover:bg-surface-hover hover:text-foreground"
      title="Hide navigation"
      aria-label="Hide navigation"
    >
      <PanelTopClose size={14} />
      <span className="hidden md:inline">Hide nav</span>
    </button>
  );
}
