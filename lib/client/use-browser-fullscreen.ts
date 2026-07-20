"use client";

import { useEffect, useState } from "react";

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
};

/** True when an element is in fullscreen, or the browser chrome is hidden (e.g. F11). */
export function isBrowserFullscreen(): boolean {
  if (typeof window === "undefined") return false;

  const doc = document as FullscreenDocument;
  if (doc.fullscreenElement ?? doc.webkitFullscreenElement ?? doc.mozFullScreenElement) {
    return true;
  }

  // Best-effort for native browser fullscreen where no element owns the API.
  const heightGap = Math.abs(window.screen.height - window.innerHeight);
  const widthGap = Math.abs(window.screen.width - window.innerWidth);
  return heightGap <= 2 && widthGap <= 2;
}

/** @deprecated Prefer NavChromeProvider — kept for standalone fullscreen checks. */
export function useBrowserFullscreen() {
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    function sync() {
      setFullscreen(isBrowserFullscreen());
    }

    sync();
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    window.addEventListener("resize", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  return fullscreen;
}
